import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEmployeeDashboard } from '../../hooks/useDashboard'
import { formatCurrency, monthLabel } from '../../types/payroll'

export function EmployeeDashboard() {
  const { profile, employeeRecord } = useAuth()
  const employeeId = employeeRecord?.id ?? profile?.uid ?? ''
  
  const { stats, notifications, loading, error } = useEmployeeDashboard(employeeId)

  if (!employeeRecord) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No official employee record matches your login email ({profile?.email}). Please ask HR to create an employee profile for you to view your personalized dashboard.
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Loading your dashboard...</p>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-8">
      {/* ── Profile Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{employeeRecord.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {employeeRecord.designation} • {employeeRecord.department}
          </p>
        </div>
        <div className="text-left sm:text-right text-sm text-gray-600 space-y-1">
          <p>ID: <span className="font-medium text-gray-900">{employeeRecord.employeeId}</span></p>
          <p>Manager: <span className="font-medium text-gray-900">{employeeRecord.managerId || 'N/A'}</span></p>
          <p>Location: <span className="font-medium text-gray-900">{employeeRecord.workLocation}</span></p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Attendance & Payroll Glance ── */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium mt-1">
                  {stats.attendanceStatus.checkedInToday ? (
                    <span className="text-green-600">Checked In</span>
                  ) : (
                    <span className="text-gray-600">Not Checked In</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Time In</p>
                <p className="font-medium mt-1">{stats.attendanceStatus.checkInTime || '--:--'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Time Out</p>
                <p className="font-medium mt-1">{stats.attendanceStatus.checkOutTime || '--:--'}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Attendance Rate:</span>
              <span className="font-bold text-indigo-600">{stats.attendanceStatus.monthlyPercentage}%</span>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Summary</h2>
            {stats.latestPayroll ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                  Latest Payslip: {monthLabel(stats.latestPayroll.month)} {stats.latestPayroll.year}
                </p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.latestPayroll.netSalary)}</p>
                <Link to={`/payroll/my`} className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  View full salary history →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No payroll records generated yet.</p>
            )}
          </section>
        </div>

        {/* ── Leave Balances ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Balances</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100">
              <p className="text-sm font-medium text-indigo-800">Casual Leave</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.leaveBalance.casual}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 border border-green-100">
              <p className="text-sm font-medium text-green-800">Sick Leave</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.leaveBalance.sick}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-800">Earned Leave</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.leaveBalance.earned}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
              <p className="text-sm font-medium text-purple-800">Work From Home</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{stats.leaveBalance.wfh}</p>
            </div>
          </div>
          <Link to={`/leaves`} className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Request Leave →
          </Link>
        </section>
      </div>

      {/* ── Notifications ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">You have no new notifications.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map(n => (
              <li key={n.id} className="py-3">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
