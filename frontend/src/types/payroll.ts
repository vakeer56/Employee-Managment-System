// ─── Salary Structure ────────────────────────────────────────────────────────

export interface SalaryStructure {
  id: string
  employeeId: string     // Firestore doc id of the employee
  employeeName: string   // Denormalised for display
  employeeCode: string   // e.g. EMP-0001
  basicPay: number
  hra: number            // House Rent Allowance
  allowances: number     // Other allowances
  deductions: number     // Fixed monthly deductions (PF, etc.)
  taxPercentage: number  // e.g. 10 means 10%
  createdAt: string
  updatedAt: string
}

export type SalaryStructureInput = Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>

// ─── Payroll Record ──────────────────────────────────────────────────────────

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  department: string
  month: number          // 1–12
  year: number           // e.g. 2025
  basicPay: number
  hra: number
  allowances: number
  bonus: number
  deductions: number
  tax: number            // calculated: grossSalary * (taxPercentage / 100)
  grossSalary: number    // basicPay + hra + allowances + bonus
  netSalary: number      // grossSalary - tax - deductions
  generatedAt: string
}

export type PayrollInput = Omit<PayrollRecord, 'id' | 'generatedAt'>

// ─── Month helpers ───────────────────────────────────────────────────────────

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function monthLabel(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label ?? String(month)
}

/** Format a number as Indian Rupees */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
