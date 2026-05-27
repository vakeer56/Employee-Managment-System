import { useEffect, useState } from 'react'
import type { LeaveBalance } from '../../types/leave'
import { getOrInitializeLeaveBalance } from '../../services/leaveService'
import { useAuth } from '../../hooks/useAuth'

export function LeaveBalanceView() {
  const { firebaseUser } = useAuth()
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBalance() {
      if (firebaseUser) {
        try {
          const b = await getOrInitializeLeaveBalance(firebaseUser.uid)
          setBalance(b)
        } catch (error) {
          console.error("Failed to load leave balance", error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchBalance()
  }, [firebaseUser])

  if (loading) return <div className="text-gray-500 text-sm">Loading balances...</div>
  if (!balance) return null

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Leave Balances</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <BalanceCard label="Casual Leave" value={balance.casualLeave} color="bg-blue-50 text-blue-700" />
        <BalanceCard label="Sick Leave" value={balance.sickLeave} color="bg-red-50 text-red-700" />
        <BalanceCard label="Earned Leave" value={balance.earnedLeave} color="bg-green-50 text-green-700" />
        <BalanceCard label="Work From Home" value={balance.wfh} color="bg-purple-50 text-purple-700" />
      </div>
    </div>
  )
}

function BalanceCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={`p-4 rounded-lg flex flex-col items-center justify-center ${color}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm mt-1 text-center">{label}</span>
    </div>
  )
}
