/**
 * SalaryStructureForm.tsx
 *
 * Add / Edit salary structure form.
 * Used in SalaryStructuresPage for both create and update flows.
 */

import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Employee } from '../../types/employee'
import type { SalaryStructure, SalaryStructureInput } from '../../types/payroll'

interface Props {
  /** Pre-populate form when editing */
  existing?: SalaryStructure | null
  /** List of employees for the dropdown (only employees without a structure when creating) */
  employees: Employee[]
  onSubmit: (input: SalaryStructureInput) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormValues {
  employeeId: string
  basicPay: string
  hra: string
  allowances: string
  deductions: string
  taxPercentage: string
}

const empty: FormValues = {
  employeeId: '',
  basicPay: '',
  hra: '',
  allowances: '',
  deductions: '',
  taxPercentage: '',
}

function fromExisting(s: SalaryStructure): FormValues {
  return {
    employeeId: s.employeeId,
    basicPay: String(s.basicPay),
    hra: String(s.hra),
    allowances: String(s.allowances),
    deductions: String(s.deductions),
    taxPercentage: String(s.taxPercentage),
  }
}

function validateNum(val: string, label: string, allowZero = true): string | undefined {
  const n = Number(val)
  if (val.trim() === '' || isNaN(n)) return `${label} must be a number.`
  if (!allowZero && n <= 0) return `${label} must be greater than 0.`
  if (n < 0) return `${label} cannot be negative.`
  return undefined
}

export function SalaryStructureForm({ existing, employees, onSubmit, onCancel, loading }: Props) {
  const [values, setValues] = useState<FormValues>(existing ? fromExisting(existing) : empty)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormValues, string>> = {}
    if (!values.employeeId) errs.employeeId = 'Please select an employee.'
    errs.basicPay = validateNum(values.basicPay, 'Basic Pay', false)
    errs.hra = validateNum(values.hra, 'HRA')
    errs.allowances = validateNum(values.allowances, 'Allowances')
    errs.deductions = validateNum(values.deductions, 'Deductions')
    errs.taxPercentage = validateNum(values.taxPercentage, 'Tax %')
    if (Number(values.taxPercentage) > 50) errs.taxPercentage = 'Tax % seems too high (max 50).'

    // Remove undefined keys
    const cleaned = Object.fromEntries(Object.entries(errs).filter(([, v]) => v)) as typeof errs
    setErrors(cleaned)
    return Object.keys(cleaned).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const employee = employees.find((emp) => emp.id === values.employeeId)
    const input: SalaryStructureInput = {
      employeeId: values.employeeId,
      employeeName: employee?.name ?? existing?.employeeName ?? '',
      employeeCode: employee?.employeeId ?? existing?.employeeCode ?? '',
      basicPay: Number(values.basicPay),
      hra: Number(values.hra),
      allowances: Number(values.allowances),
      deductions: Number(values.deductions),
      taxPercentage: Number(values.taxPercentage),
    }
    await onSubmit(input)
  }

  // Live gross salary preview
  const basicPay = Number(values.basicPay) || 0
  const hra = Number(values.hra) || 0
  const allowances = Number(values.allowances) || 0
  const deductions = Number(values.deductions) || 0
  const taxPct = Number(values.taxPercentage) || 0
  const gross = basicPay + hra + allowances
  const tax = Math.round(gross * (taxPct / 100))
  const net = gross - tax - deductions

  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border border-gray-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        {existing ? 'Edit Salary Structure' : 'Add Salary Structure'}
      </h2>

      {/* Employee selector */}
      <div className="space-y-1">
        <label htmlFor="ss-employee" className="block text-sm font-medium text-gray-700">
          Employee
        </label>
        <select
          id="ss-employee"
          value={values.employeeId}
          onChange={(e) => set('employeeId', e.target.value)}
          disabled={!!existing} // can't change employee when editing
          className={selectClass}
        >
          <option value="">— Select employee —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.employeeId} — {emp.name} ({emp.department})
            </option>
          ))}
        </select>
        {errors.employeeId && <p className="text-sm text-red-600">{errors.employeeId}</p>}
      </div>

      {/* Salary fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Basic Pay (₹)"
          name="basicPay"
          type="number"
          min="0"
          step="100"
          value={values.basicPay}
          onChange={(e) => set('basicPay', e.target.value)}
          error={errors.basicPay}
          placeholder="e.g. 50000"
          required
        />
        <Input
          label="HRA (₹)"
          name="hra"
          type="number"
          min="0"
          step="100"
          value={values.hra}
          onChange={(e) => set('hra', e.target.value)}
          error={errors.hra}
          placeholder="e.g. 20000"
          required
        />
        <Input
          label="Other Allowances (₹)"
          name="allowances"
          type="number"
          min="0"
          step="100"
          value={values.allowances}
          onChange={(e) => set('allowances', e.target.value)}
          error={errors.allowances}
          placeholder="e.g. 5000"
          required
        />
        <Input
          label="Fixed Deductions / month (₹)"
          name="deductions"
          type="number"
          min="0"
          step="100"
          value={values.deductions}
          onChange={(e) => set('deductions', e.target.value)}
          error={errors.deductions}
          placeholder="e.g. 3000 (PF, etc.)"
          required
        />
        <Input
          label="Tax Percentage (%)"
          name="taxPercentage"
          type="number"
          min="0"
          max="50"
          step="0.5"
          value={values.taxPercentage}
          onChange={(e) => set('taxPercentage', e.target.value)}
          error={errors.taxPercentage}
          placeholder="e.g. 10"
          required
        />
      </div>

      {/* Live preview */}
      {basicPay > 0 && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm">
          <p className="font-medium text-indigo-800 mb-2">Salary Preview (without bonus)</p>
          <div className="grid grid-cols-3 gap-2 text-indigo-700">
            <div>
              <p className="text-xs text-indigo-500">Gross</p>
              <p className="font-semibold">₹{gross.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-500">Tax</p>
              <p className="font-semibold">₹{tax.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-500">Net</p>
              <p className="font-semibold text-green-700">₹{net.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={loading}>
          {existing ? 'Save changes' : 'Create structure'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
