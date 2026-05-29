import { useAdminDashboard } from '../../hooks/useDashboard'
import { formatCurrency } from '../../types/payroll'

export function AdminDashboard() {
  const { stats, loading, error, refetch } = useAdminDashboard()

  if (loading) {
    return <p className="text-sm text-gray-600">Loading dashboard...</p>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!stats) return null

  // Helper for simple bar chart
  const maxDeptCount = Math.max(...stats.departmentDistribution.map(d => d.count), 1)

  return (
    <div className="space-y-8">
      {/* ── Header with Refresh Button ── */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            Total Employees
          </p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
        </div>

        {/* Departments */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            Departments
          </p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalDepartments}</p>
        </div>

        {/* Attendance % */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            Today's Attendance
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-indigo-600">{stats.attendanceOverview.attendancePercentage}%</p>
            <p className="text-sm text-gray-500">
              ({stats.attendanceOverview.presentToday} / {stats.totalEmployees})
            </p>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            Pending Leaves
          </p>
          <p className="text-3xl font-bold text-amber-600">{stats.leaveStats.pending}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Employee Distribution ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Distribution</h2>
          {stats.departmentDistribution.length === 0 ? (
            <p className="text-sm text-gray-500">No departments configured.</p>
          ) : (
            <div className="space-y-3">
              {stats.departmentDistribution.map(dept => (
                <div key={dept.department}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{dept.department}</span>
                    <span className="text-gray-500">{dept.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(dept.count / maxDeptCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Leave Analytics ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase">Approved</p>
              <p className="text-xl font-bold text-green-600">{stats.leaveAnalytics.byStatus.approved}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase">Rejected</p>
              <p className="text-xl font-bold text-red-600">{stats.leaveAnalytics.byStatus.rejected}</p>
            </div>
          </div>
          
          <h3 className="mt-4 mb-2 text-sm font-medium text-gray-700">Leave Types Requested</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700 border border-indigo-100">
              Casual: {stats.leaveAnalytics.byType.casual}
            </span>
            <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700 border border-indigo-100">
              Sick: {stats.leaveAnalytics.byType.sick}
            </span>
            <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700 border border-indigo-100">
              Earned: {stats.leaveAnalytics.byType.earned}
            </span>
            <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700 border border-indigo-100">
              WFH: {stats.leaveAnalytics.byType.wfh}
            </span>
          </div>
        </section>
      </div>

      {/* ── Payroll Analytics ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">YTD Payroll Cost Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Total Payroll Cost</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.payrollAnalytics.totalCost)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Average Salary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.payrollAnalytics.averageSalary)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
