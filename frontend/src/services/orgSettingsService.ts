import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

const orgDocRef = doc(db, 'settings', 'org')
const leaveBalancesCollection = 'leaveBalances'

const defaultLeaveBalances = {
  casualLeave: 12,
  sickLeave: 12,
  earnedLeave: 15,
  wfh: 20
}

export interface OrgSettings {
  departments: string[]
  designations: string[]
  defaultLeaveBalances: {
    casualLeave: number
    sickLeave: number
    earnedLeave: number
    wfh: number
  }
}

type LeaveBalanceField = keyof OrgSettings['defaultLeaveBalances']

const leaveBalanceFields: LeaveBalanceField[] = [
  'casualLeave',
  'sickLeave',
  'earnedLeave',
  'wfh',
]

const defaultOrg: OrgSettings = {
  departments: [],
  designations: [],
  defaultLeaveBalances
}

async function ensureOrgSettingsDoc(): Promise<void> {
  const snap = await getDoc(orgDocRef)
  if (!snap.exists()) {
    await setDoc(orgDocRef, defaultOrg)
  }
}

/** Single Firestore doc so HR can manage lists without extra collections. */
export async function getOrgSettings(): Promise<OrgSettings> {
  try {
    const snap = await getDoc(orgDocRef)
    if (!snap.exists()) {
      await setDoc(orgDocRef, defaultOrg)
      return { ...defaultOrg }
    }
    const data = snap.data()
    return {
      departments: Array.isArray(data.departments) ? data.departments : [],
      designations: Array.isArray(data.designations) ? data.designations : [],
      defaultLeaveBalances: {
        casualLeave: data.defaultLeaveBalances?.casualLeave ?? defaultLeaveBalances.casualLeave,
        sickLeave: data.defaultLeaveBalances?.sickLeave ?? defaultLeaveBalances.sickLeave,
        earnedLeave: data.defaultLeaveBalances?.earnedLeave ?? defaultLeaveBalances.earnedLeave,
        wfh: data.defaultLeaveBalances?.wfh ?? defaultLeaveBalances.wfh,
      }
    }
  } catch {
    throw new Error('Failed to load organization settings.')
  }
}

export async function addDepartment(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  try {
    await ensureOrgSettingsDoc()
    await updateDoc(orgDocRef, { departments: arrayUnion(trimmed) })
  } catch {
    throw new Error('Failed to add department.')
  }
}

export async function removeDepartment(name: string): Promise<void> {
  try {
    await ensureOrgSettingsDoc()
    await updateDoc(orgDocRef, { departments: arrayRemove(name) })
  } catch {
    throw new Error('Failed to remove department.')
  }
}

export async function addDesignation(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  try {
    await ensureOrgSettingsDoc()
    await updateDoc(orgDocRef, { designations: arrayUnion(trimmed) })
  } catch {
    throw new Error('Failed to add designation.')
  }
}

export async function removeDesignation(name: string): Promise<void> {
  try {
    await ensureOrgSettingsDoc()
    await updateDoc(orgDocRef, { designations: arrayRemove(name) })
  } catch {
    throw new Error('Failed to remove designation.')
  }
}

export async function updateDefaultLeaveBalances(balances: OrgSettings['defaultLeaveBalances']): Promise<void> {
  try {
    const currentSettings = await getOrgSettings()
    const previousBalances = currentSettings.defaultLeaveBalances
    const deltas = leaveBalanceFields.reduce(
      (acc, field) => ({
        ...acc,
        [field]: balances[field] - previousBalances[field],
      }),
      {} as OrgSettings['defaultLeaveBalances'],
    )

    const hasBalanceChanges = leaveBalanceFields.some((field) => deltas[field] !== 0)
    const existingBalances = hasBalanceChanges
      ? await getDocs(collection(db, leaveBalancesCollection))
      : null

    let batch = writeBatch(db)
    let operationCount = 0

    batch.set(orgDocRef, {
      departments: currentSettings.departments,
      designations: currentSettings.designations,
      defaultLeaveBalances: balances,
    })
    operationCount += 1

    if (existingBalances) {
      for (const balanceDoc of existingBalances.docs) {
        const data = balanceDoc.data()
        const updatedBalance = leaveBalanceFields.reduce(
          (acc, field) => {
            const currentValue = typeof data[field] === 'number'
              ? data[field]
              : previousBalances[field]

            return {
              ...acc,
              [field]: Math.max(0, currentValue + deltas[field]),
            }
          },
          {} as OrgSettings['defaultLeaveBalances'],
        )

        batch.update(balanceDoc.ref, updatedBalance)
        operationCount += 1

        if (operationCount === 500) {
          await batch.commit()
          batch = writeBatch(db)
          operationCount = 0
        }
      }
    }

    if (operationCount > 0) {
      await batch.commit()
    }
  } catch {
    throw new Error('Failed to update leave balances.')
  }
}
