import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Employee, EmployeeInput } from '../types/employee'

const employeesCollection = 'employees'

/** convert data from firestore to employee type */
export function toEmployee(id: string, data: DocumentData): Employee {
  const createdAt = data.createdAt
  return {
    id,
    employeeId: data.employeeId ?? '',
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    department: data.department ?? '',
    designation: data.designation ?? '',
    managerId: data.managerId ?? '',
    joiningDate: data.joiningDate ?? '',
    employmentType: data.employmentType ?? 'full_time',
    workLocation: data.workLocation ?? '',
    status: data.status ?? 'active',
    dateOfBirth: data.dateOfBirth ?? '',
    role: data.role,
    statusHistory: Array.isArray(data.statusHistory)
      ? data.statusHistory.map((entry: DocumentData) => ({
          status: entry.status ?? 'active',
          changedAt:
            typeof entry.changedAt === 'string'
              ? entry.changedAt
              : entry.changedAt?.toDate?.()?.toISOString() ?? '',
        }))
      : undefined,
    createdAt:
      typeof createdAt === 'string'
        ? createdAt
        : createdAt?.toDate?.()?.toISOString() ?? '',
  }
}

/** To create a new Employee in Db */
export async function addEmployee(input: EmployeeInput): Promise<Employee> {
  try {
    const statusHistory = [
      { status: input.status, changedAt: new Date().toISOString() },
    ]
    const docRef = await addDoc(collection(db, employeesCollection), {
      ...input,
      statusHistory,
      createdAt: serverTimestamp(),
    })

    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) {
      throw new Error('Employee was created but could not be loaded.')
    }

    return toEmployee(snapshot.id, snapshot.data())
  } catch {
    throw new Error('Failed to add employee. Please try again.')
  }
}

/** Fetch all employees */
export async function getEmployees(): Promise<Employee[]> {
  try {
    const snapshot = await getDocs(collection(db, employeesCollection))
    return snapshot.docs.map((docSnap) => toEmployee(docSnap.id, docSnap.data()))
  } catch {
    throw new Error('Failed to load employees.')
  }
}

/** Fetch one employee by Firestore document id */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const snapshot = await getDoc(doc(db, employeesCollection, id))
    if (!snapshot.exists()) return null
    return toEmployee(snapshot.id, snapshot.data())
  } catch {
    throw new Error('Failed to load employee.')
  }
}

/** Update an existing employee */
export async function updateEmployee(
  id: string,
  data: Partial<EmployeeInput>,
): Promise<void> {
  try {
    if (data.status !== undefined) {
      const current = await getEmployeeById(id)
      if (current && current.status !== data.status) {
        const entry = {
          status: data.status,
          changedAt: new Date().toISOString(),
        }
        const history = [...(current.statusHistory ?? []), entry]
        await updateDoc(doc(db, employeesCollection, id), {
          ...data,
          statusHistory: history,
        })
        return
      }
    }
    await updateDoc(doc(db, employeesCollection, id), data)
  } catch {
    throw new Error('Failed to update employee.')
  }
}

/** Delete an employee */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, employeesCollection, id))
  } catch {
    throw new Error('Failed to delete employee.')
  }
}
