import { useState } from 'react'
import { ApplyLeaveForm } from '../../components/leave/ApplyLeaveForm'
import { LeaveBalanceView } from '../../components/leave/LeaveBalanceView'
import { MyLeavesList } from '../../components/leave/MyLeavesList'
import { HolidayCalendar } from '../../components/leave/HolidayCalendar'
import { ManagerApprovals } from '../../components/leave/ManagerApprovals'
import { useAuth } from '../../hooks/useAuth'
import { hasRole } from '../../utils/roles'

export function LeaveDashboardPage() {
  const { profile } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'my_leaves' | 'apply' | 'approvals' | 'holidays'>('my_leaves')

  const isManagerOrAdmin = hasRole(profile?.role, ['super_admin', 'hr_admin', 'manager'])

  const handleLeaveApplied = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('my_leaves')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-600">Manage your time off, view balances, and approve requests.</p>
      </div>

      <LeaveBalanceView />

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('my_leaves')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'my_leaves'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My Leaves
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'apply'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Apply Leave
            </button>
            {isManagerOrAdmin && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === 'approvals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Approvals
              </button>
            )}
            <button
              onClick={() => setActiveTab('holidays')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'holidays'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Holidays
            </button>
          </nav>
        </div>

        <div className="p-6 bg-gray-50">
          {activeTab === 'my_leaves' && <MyLeavesList refreshKey={refreshKey} />}
          {activeTab === 'apply' && <ApplyLeaveForm onApplied={handleLeaveApplied} />}
          {activeTab === 'approvals' && isManagerOrAdmin && <ManagerApprovals />}
          {activeTab === 'holidays' && <HolidayCalendar />}
        </div>
      </div>
    </div>
  )
}
