import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Employee } from '../types/employee'
import { toEmployee } from './employeeService'

const employeesCollection = 'employees'

/** Find the employee record whose email matches the signed-in user (case-insensitive). */
export async function getEmployeeByAuthEmail(
  email: string,
): Promise<Employee | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  try {
    const q = query(
      collection(db, employeesCollection),
      where('email', '==', email.trim()),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) {
      const all = await getDocs(collection(db, employeesCollection))
      const match = all.docs.find(
        (d) =>
          String(d.data().email ?? '')
            .trim()
            .toLowerCase() === normalized,
      )
      if (!match) return null
      return toEmployee(match.id, match.data())
    }
    const docSnap = snap.docs[0]
    return toEmployee(docSnap.id, docSnap.data())
  } catch {
    throw new Error('Failed to load your employee profile.')
  }
}

export async function updateOwnProfileFields(
  employeeId: string,
  patch: { phone: string; workLocation: string },
): Promise<void> {
  try {
    await updateDoc(doc(db, employeesCollection, employeeId), {
      phone: patch.phone.trim(),
      workLocation: patch.workLocation.trim(),
    })
  } catch {
    throw new Error('Failed to update profile.')
  }
}
