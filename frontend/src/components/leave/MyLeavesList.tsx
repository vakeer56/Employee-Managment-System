import { useEffect, useState } from 'react'
import type { LeaveRequest, LeaveStatus as LeaveStatusType } from '../../types/leave'
import { LeaveStatus } from '../../types/leave'
import { getEmployeeLeaves } from '../../services/leaveService'
import { useAuth } from '../../hooks/useAuth'

export function MyLeavesList({ refreshKey }: { refreshKey: number }) {
  const { firebaseUser } = useAuth()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaves() {
      if (firebaseUser) {
        try {
          const data = await getEmployeeLeaves(firebaseUser.uid)
          // Sort by appliedOn descending
          data.sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime())
          setLeaves(data)
        } catch (error) {
          console.error("Failed to fetch leaves", error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchLeaves()
  }, [firebaseUser, refreshKey])

  if (loading) return <div className="text-gray-500 text-sm">Loading leave history...</div>

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold">My Leave History</h2>
      </div>
      
      {leaves.length === 0 ? (
        <div className="p-6 text-gray-500 text-center">No leave applications found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Applied On</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{leave.type}</td>
                  <td className="px-6 py-4">
                    {leave.startDate} to {leave.endDate}
                  </td>
                  <td className="px-6 py-4">{new Date(leave.appliedOn).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={leave.status} />
                  </td>
                  <td className="px-6 py-4">{leave.managerRemarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: LeaveStatusType }) {
  let color = 'bg-yellow-100 text-yellow-800'
  if (status === LeaveStatus.APPROVED) color = 'bg-green-100 text-green-800'
  if (status === LeaveStatus.REJECTED) color = 'bg-red-100 text-red-800'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  )
}
