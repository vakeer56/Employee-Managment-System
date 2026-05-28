import { useEffect, useState } from 'react'
import type { LeaveRequest, LeaveStatus as LeaveStatusType } from '../../types/leave'
import { LeaveStatus } from '../../types/leave'
import { getPendingLeavesForManager, updateLeaveStatus } from '../../services/leaveService'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function ManagerApprovals({ onApprovalUpdated }: { onApprovalUpdated?: () => void }) {
  const { profile } = useAuth()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchLeaves() {
      if (profile) {
        try {
          const data = await getPendingLeavesForManager()
          setLeaves(data)
        } catch (error) {
          console.error("Failed to fetch pending leaves", error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchLeaves()
  }, [profile])

  const handleAction = async (leave: LeaveRequest, status: LeaveStatusType) => {
    try {
      await updateLeaveStatus(
        leave.id!, 
        status, 
        remarks[leave.id!] || ''
      )
      
      // Remove from list
      setLeaves(leaves.filter(l => l.id !== leave.id))
      
      // Trigger refresh of balance and other components
      if (onApprovalUpdated) {
        onApprovalUpdated()
      }
    } catch (err) {
      console.error("Failed to update leave status", err)
      alert("Failed to update status")
    }
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading approvals...</div>

  if (leaves.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
        No pending leave requests for your approval.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leaves.map(leave => (
        <div key={leave.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">{leave.employeeName}</div>
            <div className="text-sm text-gray-500">
              {leave.type} &bull; {leave.startDate} to {leave.endDate}
            </div>
            <div className="text-sm mt-2 text-gray-700">Reason: {leave.reason}</div>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Input 
              label=""
              placeholder="Remarks (optional)" 
              value={remarks[leave.id!] || ''}
              onChange={(e) => setRemarks({ ...remarks, [leave.id!]: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={() => handleAction(leave, LeaveStatus.APPROVED)} className="bg-green-600 hover:bg-green-700 flex-1">Approve</Button>
              <Button onClick={() => handleAction(leave, LeaveStatus.REJECTED)} variant="secondary" className="text-red-600 hover:text-red-700 flex-1">Reject</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
