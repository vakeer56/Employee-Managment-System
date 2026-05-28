import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import type { LeaveRequest, LeaveBalance, LeaveStatus as LeaveStatusType, Holiday, LeaveType as LeaveTypeType } from '../types/leave'
import { LeaveStatus, LeaveType } from '../types/leave'

import { getOrgSettings } from './orgSettingsService'

const LEAVES_COLLECTION = 'leaves'
const LEAVE_BALANCES_COLLECTION = 'leaveBalances'
const HOLIDAYS_COLLECTION = 'holidays'

type LeaveBalanceField = 'casualLeave' | 'sickLeave' | 'earnedLeave' | 'wfh'

const balanceFieldByLeaveType: Record<LeaveTypeType, LeaveBalanceField> = {
  [LeaveType.CASUAL]: 'casualLeave',
  [LeaveType.SICK]: 'sickLeave',
  [LeaveType.EARNED]: 'earnedLeave',
  [LeaveType.WFH]: 'wfh',
}

function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('Leave request has an invalid date range.')
  }

  return days
}

// Initialize default balance for a new employee or return existing
export async function getOrInitializeLeaveBalance(employeeId: string): Promise<LeaveBalance> {
  const q = query(collection(db, LEAVE_BALANCES_COLLECTION), where('employeeId', '==', employeeId))
  const snapshot = await getDocs(q)

  const orgSettings = await getOrgSettings()
  const defaults = {
    casualLeave: orgSettings.defaultLeaveBalances?.casualLeave ?? 0,
    sickLeave: orgSettings.defaultLeaveBalances?.sickLeave ?? 0,
    earnedLeave: orgSettings.defaultLeaveBalances?.earnedLeave ?? 0,
    wfh: orgSettings.defaultLeaveBalances?.wfh ?? 0
  }

  if (!snapshot.empty) {
    const docData = snapshot.docs[0]
    const currentBalance = docData.data() as LeaveBalance

    const legacyDefaults = {
      casualLeave: 0,
      sickLeave: 0,
      earnedLeave: 0,
      wfh: 0,
    }

    const isLegacyBalance =
      currentBalance.casualLeave === legacyDefaults.casualLeave &&
      currentBalance.sickLeave === legacyDefaults.sickLeave &&
      currentBalance.earnedLeave === legacyDefaults.earnedLeave &&
      currentBalance.wfh === legacyDefaults.wfh &&
      Object.values(defaults).some((value) => value > 0)

    const normalizedBalance: LeaveBalance = {
      employeeId,
      casualLeave: currentBalance.casualLeave ?? defaults.casualLeave,
      sickLeave: currentBalance.sickLeave ?? defaults.sickLeave,
      earnedLeave: currentBalance.earnedLeave ?? defaults.earnedLeave,
      wfh: currentBalance.wfh ?? defaults.wfh,
    }

    if (isLegacyBalance ||
        normalizedBalance.casualLeave !== currentBalance.casualLeave ||
        normalizedBalance.sickLeave !== currentBalance.sickLeave ||
        normalizedBalance.earnedLeave !== currentBalance.earnedLeave ||
        normalizedBalance.wfh !== currentBalance.wfh) {
      await updateDoc(docData.ref, {
        employeeId: normalizedBalance.employeeId,
        casualLeave: normalizedBalance.casualLeave,
        sickLeave: normalizedBalance.sickLeave,
        earnedLeave: normalizedBalance.earnedLeave,
        wfh: normalizedBalance.wfh,
      })
      return { ...normalizedBalance, id: docData.id }
    }

    return { ...currentBalance, id: docData.id }
  }

  const defaultBalance: LeaveBalance = {
    employeeId,
    ...defaults
  }
  const balanceRef = doc(db, LEAVE_BALANCES_COLLECTION, employeeId)
  await setDoc(balanceRef, defaultBalance)
  return { id: balanceRef.id, ...defaultBalance }
}

export function subscribeToLeaveBalance(
  employeeId: string,
  onChange: (balance: LeaveBalance | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, LEAVE_BALANCES_COLLECTION), where('employeeId', '==', employeeId))

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onChange(null)
        return
      }

      const balanceDoc = snapshot.docs[0]
      onChange({ id: balanceDoc.id, ...balanceDoc.data() } as LeaveBalance)
    },
    onError,
  )
}

export async function applyForLeave(request: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>): Promise<string> {
  const newRequest: Omit<LeaveRequest, 'id'> = {
    ...request,
    status: LeaveStatus.PENDING,
    appliedOn: new Date().toISOString(),
  }
  
  const docRef = await addDoc(collection(db, LEAVES_COLLECTION), newRequest)
  return docRef.id
}

export async function getEmployeeLeaves(employeeId: string): Promise<LeaveRequest[]> {
  const q = query(
    collection(db, LEAVES_COLLECTION),
    where('employeeId', '==', employeeId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LeaveRequest))
}

export async function getPendingLeavesForManager(): Promise<LeaveRequest[]> {
  // Simple fetch all pending leaves (in a real app, filter by managerId or department)
  const q = query(
    collection(db, LEAVES_COLLECTION),
    where('status', '==', LeaveStatus.PENDING)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as LeaveRequest))
}

export async function updateLeaveStatus(
  leaveId: string, 
  status: LeaveStatusType, 
  managerRemarks?: string
): Promise<void> {
  const leaveRef = doc(db, LEAVES_COLLECTION, leaveId)
  const leaveSnapshot = await getDoc(leaveRef)

  if (!leaveSnapshot.exists()) {
    throw new Error('Leave request was not found.')
  }

  const leave = { id: leaveSnapshot.id, ...leaveSnapshot.data() } as LeaveRequest
  const batch = writeBatch(db)

  batch.update(leaveRef, {
    status,
    managerRemarks: managerRemarks || '',
  })

  if (status === LeaveStatus.APPROVED) {
    const balance = await getOrInitializeLeaveBalance(leave.employeeId)
    const fieldToUpdate = balanceFieldByLeaveType[leave.type]
    
    if (!fieldToUpdate || !balance.id) {
      throw new Error('Leave request has an invalid leave type.')
    }

    const days = calculateLeaveDays(leave.startDate, leave.endDate)
    const balanceRef = doc(db, LEAVE_BALANCES_COLLECTION, balance.id)

    batch.update(balanceRef, {
      [fieldToUpdate]: Math.max(0, balance[fieldToUpdate] - days)
    })
  }

  await batch.commit()
}

export async function getHolidays(): Promise<Holiday[]> {
  const snapshot = await getDocs(collection(db, HOLIDAYS_COLLECTION))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Holiday))
}

export async function addHoliday(holiday: Omit<Holiday, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, HOLIDAYS_COLLECTION), holiday)
  return docRef.id
}

export async function removeHoliday(holidayId: string): Promise<void> {
  const holidayRef = doc(db, HOLIDAYS_COLLECTION, holidayId)
  await deleteDoc(holidayRef)
}
