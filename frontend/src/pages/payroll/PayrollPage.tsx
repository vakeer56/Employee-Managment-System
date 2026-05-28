/**
 * PayrollPage.tsx
 *
 * Main payroll management page for admin/HR:
 *  - Analytics for selected month/year
 *  - Generate payroll (single employee or all employees)
 *  - View all payroll records with filters
 *  - Delete payroll records
 *
 * Route: /payroll  (super_admin, hr_admin only)
 */

import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { PayrollTable } from '../../components/payroll/PayrollTable'
import { PayrollAnalytics } from '../../components/payroll/PayrollAnalytics'
import { useAllPayrolls, useAllSalaryStructures, usePayrollAnalytics } from '../../hooks/usePayroll'
import {
  generatePayroll,
  generatePayrollForAll,
  deletePayroll,
} from '../../services/payrollService'
import { MONTHS, monthLabel } from '../../types/payroll'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export function PayrollPage() {
  const { payrolls, loading: payrollLoading, error: payrollError, refresh } = useAllPayrolls()
  const { structures } = useAllSalaryStructures()

  // Generate controls
  const [genMonth, setGenMonth] = useState(currentMonth)
  const [genYear, setGenYear] = useState(currentYear)
  const [genEmployeeId, setGenEmployeeId] = useState('')
  const [genBonus, setGenBonus] = useState('0')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  // Analytics for selected period
  const [analyticsMonth, setAnalyticsMonth] = useState(currentMonth)
  const [analyticsYear, setAnalyticsYear] = useState(currentYear)
  const { analytics, loading: analyticsLoading } = usePayrollAnalytics(analyticsMonth, analyticsYear)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenResult(null)
    setGenError(null)
    try {
      if (genEmployeeId) {
        await generatePayroll(genEmployeeId, genMonth, genYear, Number(genBonus) || 0)
        setGenResult(`✓ Payroll generated for ${monthLabel(genMonth)} ${genYear}.`)
      } else {
        const result = await generatePayrollForAll(genMonth, genYear, Number(genBonus) || 0)
        setGenResult(
          `✓ Generated: ${result.generated} | Skipped (already exist): ${result.skipped}${
            result.errors.length > 0 ? ` | Errors: ${result.errors.join('; ')}` : ''
          }`,
        )
      }
      await refresh()
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this payroll record? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deletePayroll(id)
      showToast('success', 'Payroll record deleted.')
      await refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete.')
    } finally {
      setDeletingId(null)
    }
  }

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payroll Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate, view, and manage monthly payroll records.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Analytics section ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
          <select
            value={analyticsMonth}
            onChange={(e) => setAnalyticsMonth(Number(e.target.value))}
            className={selectClass}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={analyticsYear}
            onChange={(e) => setAnalyticsYear(Number(e.target.value))}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {analytics && <PayrollAnalytics analytics={analytics} loading={analyticsLoading} />}
      </section>

      {/* ── Generate Payroll section ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Generate Payroll</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Month */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Month</label>
            <select
              value={genMonth}
              onChange={(e) => setGenMonth(Number(e.target.value))}
              className={`w-full ${selectClass}`}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <select
              value={genYear}
              onChange={(e) => setGenYear(Number(e.target.value))}
              className={`w-full ${selectClass}`}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Employee (optional — leave blank for all) */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Employee <span className="text-gray-400 font-normal">(blank = all)</span>
            </label>
            <select
              value={genEmployeeId}
              onChange={(e) => setGenEmployeeId(e.target.value)}
              className={`w-full ${selectClass}`}
            >
              <option value="">— All employees —</option>
              {structures.map((s) => (
                <option key={s.employeeId} value={s.employeeId}>
                  {s.employeeCode} — {s.employeeName}
                </option>
              ))}
            </select>
          </div>

          {/* Bonus */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Bonus (₹)</label>
            <input
              type="number"
              min="0"
              step="500"
              value={genBonus}
              onChange={(e) => setGenBonus(e.target.value)}
              className={`w-full ${selectClass}`}
              placeholder="0"
            />
          </div>
        </div>

        {/* Result / error */}
        {genResult && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {genResult}
          </p>
        )}
        {genError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {genError}
          </p>
        )}

        <Button onClick={handleGenerate} loading={generating}>
          {generating
            ? 'Generating…'
            : genEmployeeId
            ? `Generate for ${monthLabel(genMonth)} ${genYear}`
            : `Generate All — ${monthLabel(genMonth)} ${genYear}`}
        </Button>
      </section>

      {/* ── Payroll Records section ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">All Payroll Records</h2>
        {payrollError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {payrollError}
          </p>
        )}
        {payrollLoading ? (
          <p className="text-sm text-gray-600">Loading payroll records…</p>
        ) : (
          <PayrollTable
            records={payrolls}
            showDelete
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </section>
    </div>
  )
}
