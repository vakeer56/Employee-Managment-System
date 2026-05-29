/**
 * MyPayrollPage.tsx
 *
 * Employee self-service payroll view.
 * Shows only records belonging to the logged-in employee.
 *
 * Sections:
 *  - Current month summary card
 *  - Latest salary slip quick-link
 *  - Full salary history table
 *
 * Route: /payroll/my  (all authenticated employees)
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEmployeePayroll, useSalaryStructure } from '../../hooks/usePayroll'
import { PayrollTable } from '../../components/payroll/PayrollTable'
import { formatCurrency, monthLabel } from '../../types/payroll'

export function MyPayrollPage() {
  const { profile, employeeRecord } = useAuth()
  const employeeId = employeeRecord?.id ?? profile?.uid ?? ''

  const { payrolls, loading, error } = useEmployeePayroll(employeeId)
  const { structure } = useSalaryStructure(employeeId)

  // Current month / year
  const now = new Date()
  const thisMonth = now.getMonth() + 1
  const thisYear = now.getFullYear()

  // Latest record
  const latestRecord = payrolls[0] ?? null

  // Current month record (if generated)
  const currentMonthRecord = useMemo(
    () => payrolls.find((r) => r.month === thisMonth && r.year === thisYear) ?? null,
    [payrolls, thisMonth, thisYear],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Payroll</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your salary details and download your salary slips.
        </p>
      </div>

      {!employeeRecord && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No employee record matches your login email ({profile?.email}). Ask HR to create an employee profile for you so your payroll is properly linked to your official record.
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Loading your payroll…</p>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Current month */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-1">
                {monthLabel(thisMonth)} {thisYear} (Net)
              </p>
              {currentMonthRecord ? (
                <p className="text-2xl font-bold text-indigo-800">
                  {formatCurrency(currentMonthRecord.netSalary)}
                </p>
              ) : (
                <p className="text-sm text-indigo-400 mt-2">Not yet generated</p>
              )}
            </div>

            {/* Latest slip */}
            <div className="rounded-xl border border-green-100 bg-green-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-green-500 mb-1">
                Latest Salary Slip
              </p>
              {latestRecord ? (
                <div>
                  <p className="font-semibold text-green-800">
                    {monthLabel(latestRecord.month)} {latestRecord.year}
                  </p>
                  <Link
                    to={`/payroll/slip/${latestRecord.id}`}
                    className="mt-2 inline-block text-sm text-green-700 underline hover:text-green-900"
                  >
                    View slip →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-green-400 mt-2">No slip available yet</p>
              )}
            </div>

            {/* Salary structure summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                Base (from structure)
              </p>
              {structure ? (
                <div className="text-sm text-gray-700 space-y-1 mt-1">
                  <div className="flex justify-between">
                    <span>Basic Pay</span>
                    <span className="font-medium">{formatCurrency(structure.basicPay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA</span>
                    <span className="font-medium">{formatCurrency(structure.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Rate</span>
                    <span className="font-medium">{structure.taxPercentage}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-2">No structure assigned yet</p>
              )}
            </div>
          </div>

          {/* ── Salary history ── */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Salary History</h2>
            {payrolls.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                No payroll records found. Your HR team will generate them each month.
              </p>
            ) : (
              <PayrollTable records={payrolls} showDelete={false} />
            )}
          </section>
        </>
      )}
    </div>
  )
}
