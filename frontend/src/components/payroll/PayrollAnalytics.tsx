/**
 * PayrollAnalytics.tsx
 *
 * Analytics cards showing:
 *  - Total Payroll Cost
 *  - Average Salary
 *  - Total Bonuses
 *  - Department-wise breakdown
 *
 * Used at the top of PayrollPage.
 */

import { formatCurrency } from '../../types/payroll'
import type { PayrollAnalytics as AnalyticsData } from '../../services/payrollService'

interface Props {
  analytics: AnalyticsData
  loading?: boolean
}

export function PayrollAnalytics({ analytics, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const deptEntries = Object.entries(analytics.departmentWise).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          label="Total Payroll Cost"
          value={formatCurrency(analytics.totalPayrollCost)}
          color="indigo"
          icon="💰"
        />
        <Card
          label="Average Net Salary"
          value={formatCurrency(analytics.averageSalary)}
          color="green"
          icon="📊"
        />
        <Card
          label="Total Bonuses Paid"
          value={formatCurrency(analytics.totalBonuses)}
          color="amber"
          icon="🎁"
        />
      </div>

      {/* Department-wise breakdown */}
      {deptEntries.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Department-wise Salary Cost</h3>
          <div className="space-y-3">
            {deptEntries.map(([dept, total]) => {
              const pct =
                analytics.totalPayrollCost > 0
                  ? Math.round((total / analytics.totalPayrollCost) * 100)
                  : 0
              return (
                <div key={dept}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{dept}</span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(total)} <span className="text-gray-400 text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Card({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string
  color: 'indigo' | 'green' | 'amber'
  icon: string
}) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-800',
    green: 'bg-green-50 border-green-100 text-green-800',
    amber: 'bg-amber-50 border-amber-100 text-amber-800',
  }[color]

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
