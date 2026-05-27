import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const orgDocRef = doc(db, 'settings', 'org')

export interface OrgSettings {
  departments: string[]
  designations: string[]
}

const defaultOrg: OrgSettings = {
  departments: [],
  designations: [],
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
