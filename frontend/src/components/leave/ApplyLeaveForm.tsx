import { useState } from 'react'
import type { LeaveType as LeaveTypeType } from '../../types/leave'
import { LeaveType } from '../../types/leave'
import { applyForLeave } from '../../services/leaveService'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function ApplyLeaveForm({ onApplied }: { onApplied: () => void }) {
  const { profile, firebaseUser } = useAuth()
  const [type, setType] = useState<LeaveTypeType>(LeaveType.CASUAL)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !firebaseUser) return

    setLoading(true)
    setError('')
    try {
      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date cannot be after end date')
      }

      await applyForLeave({
        employeeId: firebaseUser.uid,
        employeeName: profile.displayName || 'Employee',
        type,
        startDate,
        endDate,
        reason,
      })
      
      setStartDate('')
      setEndDate('')
      setReason('')
      onApplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for leave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeaveTypeType)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.values(LeaveType).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Submit Leave Request
        </Button>
      </form>
    </div>
  )
}
