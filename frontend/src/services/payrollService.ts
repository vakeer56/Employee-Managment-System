/**
 * payrollService.ts
 *
 * All Firestore logic for:
 *  - salaryStructures collection
 *  - payroll collection
 *
 * Keep all DB calls here; pages/components should not import from 'firebase/firestore' directly.
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  SalaryStructure,
  SalaryStructureInput,
  PayrollRecord,
  PayrollInput,
} from '../types/payroll'

// ─── Collection names ────────────────────────────────────────────────────────
const SS_COL = 'salaryStructures'
const PR_COL = 'payroll'

// ─── Converters ──────────────────────────────────────────────────────────────

function toSalaryStructure(id: string, data: DocumentData): SalaryStructure {
  return {
    id,
    employeeId: data.employeeId ?? '',
    employeeName: data.employeeName ?? '',
    employeeCode: data.employeeCode ?? '',
    basicPay: data.basicPay ?? 0,
    hra: data.hra ?? 0,
    allowances: data.allowances ?? 0,
    deductions: data.deductions ?? 0,
    taxPercentage: data.taxPercentage ?? 0,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updatedAt:
      typeof data.updatedAt === 'string'
        ? data.updatedAt
        : data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

function toPayrollRecord(id: string, data: DocumentData): PayrollRecord {
  return {
    id,
    employeeId: data.employeeId ?? '',
    employeeName: data.employeeName ?? '',
    employeeCode: data.employeeCode ?? '',
    department: data.department ?? '',
    month: data.month ?? 1,
    year: data.year ?? new Date().getFullYear(),
    basicPay: data.basicPay ?? 0,
    hra: data.hra ?? 0,
    allowances: data.allowances ?? 0,
    bonus: data.bonus ?? 0,
    deductions: data.deductions ?? 0,
    tax: data.tax ?? 0,
    grossSalary: data.grossSalary ?? 0,
    netSalary: data.netSalary ?? 0,
    generatedAt:
      typeof data.generatedAt === 'string'
        ? data.generatedAt
        : data.generatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY STRUCTURE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all salary structures */
export async function getAllSalaryStructures(): Promise<SalaryStructure[]> {
  const snap = await getDocs(collection(db, SS_COL))
  return snap.docs.map((d) => toSalaryStructure(d.id, d.data()))
}

/** Fetch salary structure by Firestore doc id */
export async function getSalaryStructureById(id: string): Promise<SalaryStructure | null> {
  const snap = await getDoc(doc(db, SS_COL, id))
  if (!snap.exists()) return null
  return toSalaryStructure(snap.id, snap.data())
}

/**
 * Fetch salary structure for a specific employee.
 * Returns null if none exists.
 */
export async function getSalaryStructure(employeeId: string): Promise<SalaryStructure | null> {
  const q = query(collection(db, SS_COL), where('employeeId', '==', employeeId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return toSalaryStructure(d.id, d.data())
}

/**
 * Create a new salary structure.
 * Throws if one already exists for this employee.
 */
export async function createSalaryStructure(
  input: SalaryStructureInput,
): Promise<SalaryStructure> {
  // Duplicate guard
  const existing = await getSalaryStructure(input.employeeId)
  if (existing) {
    throw new Error(
      `A salary structure already exists for ${input.employeeName}. Use Edit to update it.`,
    )
  }

  const now = new Date().toISOString()
  const docRef = await addDoc(collection(db, SS_COL), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...input, createdAt: now, updatedAt: now }
}

/** Update an existing salary structure */
export async function updateSalaryStructure(
  id: string,
  input: Partial<SalaryStructureInput>,
): Promise<void> {
  await updateDoc(doc(db, SS_COL, id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

/** Delete a salary structure */
export async function deleteSalaryStructure(id: string): Promise<void> {
  await deleteDoc(doc(db, SS_COL, id))
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all payroll records, sorted newest first */
export async function getPayrolls(): Promise<PayrollRecord[]> {
  const snap = await getDocs(collection(db, PR_COL))
  return snap.docs
    .map((d) => toPayrollRecord(d.id, d.data()))
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return b.month - a.month
    })
}

/** Fetch payroll records for one employee */
export async function getPayrollByEmployee(employeeId: string): Promise<PayrollRecord[]> {
  const q = query(collection(db, PR_COL), where('employeeId', '==', employeeId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => toPayrollRecord(d.id, d.data()))
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return b.month - a.month
    })
}

/** Fetch one payroll record by id */
export async function getPayrollById(id: string): Promise<PayrollRecord | null> {
  const snap = await getDoc(doc(db, PR_COL, id))
  if (!snap.exists()) return null
  return toPayrollRecord(snap.id, snap.data())
}

/**
 * Core payroll calculation.
 * grossSalary = basicPay + hra + allowances + bonus
 * tax         = grossSalary * (taxPercentage / 100)
 * netSalary   = grossSalary - tax - deductions
 */
export function calculatePayroll(
  structure: SalaryStructure,
  bonus: number,
): Pick<PayrollRecord, 'grossSalary' | 'tax' | 'netSalary'> {
  const grossSalary = structure.basicPay + structure.hra + structure.allowances + bonus
  const tax = Math.round(grossSalary * (structure.taxPercentage / 100))
  const netSalary = grossSalary - tax - structure.deductions
  return { grossSalary, tax, netSalary }
}

/**
 * Generate payroll for a single employee for a given month/year.
 * Throws if payroll already exists for that employee/month/year.
 */
export async function generatePayroll(
  employeeId: string,
  month: number,
  year: number,
  bonus: number = 0,
): Promise<PayrollRecord> {
  // 1. Load salary structure
  const structure = await getSalaryStructure(employeeId)
  if (!structure) {
    throw new Error('No salary structure found for this employee. Please create one first.')
  }

  // 2. Duplicate guard
  const dupQ = query(
    collection(db, PR_COL),
    where('employeeId', '==', employeeId),
    where('month', '==', month),
    where('year', '==', year),
  )
  const dupSnap = await getDocs(dupQ)
  if (!dupSnap.empty) {
    throw new Error(
      `Payroll for ${structure.employeeName} (${month}/${year}) has already been generated.`,
    )
  }

  // 3. Calculate
  const { grossSalary, tax, netSalary } = calculatePayroll(structure, bonus)

  // 4. We need the employee's department — it's stored on the structure
  // (we'll load it from employees if needed, but for simplicity store on structure)
  const payrollInput: PayrollInput = {
    employeeId,
    employeeName: structure.employeeName,
    employeeCode: structure.employeeCode,
    department: '', // populated below
    month,
    year,
    basicPay: structure.basicPay,
    hra: structure.hra,
    allowances: structure.allowances,
    bonus,
    deductions: structure.deductions,
    tax,
    grossSalary,
    netSalary,
  }

  // Fetch department from employees collection
  try {
    const empSnap = await getDocs(
      query(collection(db, 'employees'), where('__name__', '==', employeeId)),
    )
    if (!empSnap.empty) {
      payrollInput.department = empSnap.docs[0].data().department ?? ''
    }
  } catch {
    // department is optional — don't block payroll generation
  }

  const docRef = await addDoc(collection(db, PR_COL), {
    ...payrollInput,
    generatedAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    ...payrollInput,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Generate payroll for ALL employees that have a salary structure
 * for the given month/year. Skips employees that already have payroll.
 *
 * Returns { generated, skipped, errors } counts.
 */
export async function generatePayrollForAll(
  month: number,
  year: number,
  bonus: number = 0,
): Promise<{ generated: number; skipped: number; errors: string[] }> {
  const structures = await getAllSalaryStructures()
  let generated = 0
  let skipped = 0
  const errors: string[] = []

  // Use individual writes (not batch) because each needs duplicate checking
  for (const structure of structures) {
    try {
      // Check for existing payroll
      const dupQ = query(
        collection(db, PR_COL),
        where('employeeId', '==', structure.employeeId),
        where('month', '==', month),
        where('year', '==', year),
      )
      const dupSnap = await getDocs(dupQ)
      if (!dupSnap.empty) {
        skipped++
        continue
      }

      const { grossSalary, tax, netSalary } = calculatePayroll(structure, bonus)

      await addDoc(collection(db, PR_COL), {
        employeeId: structure.employeeId,
        employeeName: structure.employeeName,
        employeeCode: structure.employeeCode,
        department: '',
        month,
        year,
        basicPay: structure.basicPay,
        hra: structure.hra,
        allowances: structure.allowances,
        bonus,
        deductions: structure.deductions,
        tax,
        grossSalary,
        netSalary,
        generatedAt: serverTimestamp(),
      })
      generated++
    } catch (err) {
      errors.push(
        `${structure.employeeName}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  }

  return { generated, skipped, errors }
}

/** Delete a payroll record */
export async function deletePayroll(id: string): Promise<void> {
  await deleteDoc(doc(db, PR_COL, id))
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollAnalytics {
  totalPayrollCost: number
  averageSalary: number
  totalBonuses: number
  /** { department: total } */
  departmentWise: Record<string, number>
}

/**
 * Compute analytics for a specific month/year.
 * Fetches all payroll records for that period.
 */
export async function getPayrollAnalytics(
  month: number,
  year: number,
): Promise<PayrollAnalytics> {
  const q = query(
    collection(db, PR_COL),
    where('month', '==', month),
    where('year', '==', year),
  )
  const snap = await getDocs(q)
  const records = snap.docs.map((d) => toPayrollRecord(d.id, d.data()))

  if (records.length === 0) {
    return { totalPayrollCost: 0, averageSalary: 0, totalBonuses: 0, departmentWise: {} }
  }

  const totalPayrollCost = records.reduce((sum, r) => sum + r.netSalary, 0)
  const averageSalary = Math.round(totalPayrollCost / records.length)
  const totalBonuses = records.reduce((sum, r) => sum + r.bonus, 0)

  const departmentWise: Record<string, number> = {}
  for (const r of records) {
    const dept = r.department || 'Unknown'
    departmentWise[dept] = (departmentWise[dept] ?? 0) + r.netSalary
  }

  return { totalPayrollCost, averageSalary, totalBonuses, departmentWise }
}

/**
 * Batch delete payroll records — used by admin "delete all for month"
 */
export async function deletePayrollBatch(ids: string[]): Promise<void> {
  const batch = writeBatch(db)
  for (const id of ids) {
    batch.delete(doc(db, PR_COL, id))
  }
  await batch.commit()
}
