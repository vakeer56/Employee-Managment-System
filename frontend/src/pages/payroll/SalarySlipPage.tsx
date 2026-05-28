/**
 * SalarySlipPage.tsx
 *
 * Displays a printable salary slip for a given payroll record ID.
 * Route: /payroll/slip/:id
 *
 * Accessible by the employee the slip belongs to, or any admin/HR.
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SalarySlip } from '../../components/payroll/SalarySlip'
import { getPayrollById } from '../../services/payrollService'
import type { PayrollRecord } from '../../types/payroll'

export function SalarySlipPage() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<PayrollRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setError('No payroll ID provided.'); setLoading(false); return }

    getPayrollById(id)
      .then((data) => {
        if (!data) setError('Payroll record not found.')
        else setRecord(data)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load salary slip.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        Loading salary slip…
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Payroll record not found.'}
        </p>
        <Link to="/payroll" className="text-sm text-indigo-600 hover:underline">
          ← Back to Payroll
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb — hidden when printing */}
      <div className="flex items-center gap-2 text-sm text-gray-500 print:hidden">
        <Link to="/payroll" className="hover:text-indigo-600">Payroll</Link>
        <span>›</span>
        <span className="text-gray-700">Salary Slip</span>
      </div>

      <SalarySlip record={record} />
    </div>
  )
}
