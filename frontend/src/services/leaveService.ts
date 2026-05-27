import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { db } from './firebase'
import type { LeaveRequest, LeaveBalance, LeaveStatus as LeaveStatusType, Holiday, LeaveType as LeaveTypeType } from '../types/leave'
import { LeaveStatus, LeaveType } from '../types/leave'

const LEAVES_COLLECTION = 'leaves'
const LEAVE_BALANCES_COLLECTION = 'leaveBalances'

// Initialize default balance for a new employee or return existing
export async function getOrInitializeLeaveBalance(employeeId: string): Promise<LeaveBalance> {
  const q = query(collection(db, LEAVE_BALANCES_COLLECTION), where('employeeId', '==', employeeId))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const docData = snapshot.docs[0]
    return { id: docData.id, ...docData.data() } as LeaveBalance
  }

  // Initialize new balance
  const defaultBalance: LeaveBalance = {
    employeeId,
    casualLeave: 12,
    sickLeave: 12,
    earnedLeave: 15,
    wfh: 20
  }
  const docRef = await addDoc(collection(db, LEAVE_BALANCES_COLLECTION), defaultBalance)
  return { id: docRef.id, ...defaultBalance }
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
  managerRemarks?: string,
  employeeId?: string,
  leaveType?: LeaveTypeType,
  days?: number // number of days to deduct
): Promise<void> {
  const leaveRef = doc(db, LEAVES_COLLECTION, leaveId)
  await updateDoc(leaveRef, {
    status,
    managerRemarks: managerRemarks || '',
  })

  // If approved, deduct balance
  if (status === LeaveStatus.APPROVED && employeeId && leaveType && days) {
    const q = query(collection(db, LEAVE_BALANCES_COLLECTION), where('employeeId', '==', employeeId))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const balanceDoc = snapshot.docs[0]
      const currentBalance = balanceDoc.data() as LeaveBalance
      
      let fieldToUpdate = ''
      if (leaveType === LeaveType.CASUAL) fieldToUpdate = 'casualLeave'
      else if (leaveType === LeaveType.SICK) fieldToUpdate = 'sickLeave'
      else if (leaveType === LeaveType.EARNED) fieldToUpdate = 'earnedLeave'
      else if (leaveType === LeaveType.WFH) fieldToUpdate = 'wfh'

      if (fieldToUpdate) {
        await updateDoc(balanceDoc.ref, {
          [fieldToUpdate]: Math.max(0, currentBalance[fieldToUpdate as keyof LeaveBalance] as number - days)
        })
      }
    }
  }
}

export async function getHolidays(): Promise<Holiday[]> {
  // Mock holidays since we might not have them in DB yet
  return [
    { id: '1', name: 'New Year', date: `${new Date().getFullYear()}-01-01` },
    { id: '2', name: 'Independence Day', date: `${new Date().getFullYear()}-08-15` },
    { id: '3', name: 'Christmas', date: `${new Date().getFullYear()}-12-25` },
  ]
}
