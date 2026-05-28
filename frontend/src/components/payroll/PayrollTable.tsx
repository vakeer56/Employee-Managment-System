/**
 * PayrollTable.tsx
 *
 * Reusable payroll records table with search + month/year filters.
 * Used in PayrollPage (admin) and MyPayrollPage (employee self-view).
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import type { PayrollRecord } from '../../types/payroll'
import { monthLabel, formatCurrency, MONTHS } from '../../types/payroll'

interface Props {
  records: PayrollRecord[]
  /** Show delete action? (admin only) */
  showDelete?: boolean
  onDelete?: (id: string) => void
  deletingId?: string | null
}

export function PayrollTable({ records, showDelete = false, onDelete, deletingId }: Props) {
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState<string>('') // '' = all
  const [filterYear, setFilterYear] = useState<string>('')

  // Build list of available years from the data
  const years = useMemo(() => {
    const set = new Set(records.map((r) => r.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [records])

  // Apply filters
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const term = search.toLowerCase()
      const matchSearch =
        !term ||
        r.employeeName.toLowerCase().includes(term) ||
        r.employeeCode.toLowerCase().includes(term)
      const matchMonth = !filterMonth || r.month === Number(filterMonth)
      const matchYear = !filterYear || r.year === Number(filterYear)
      return matchSearch && matchMonth && matchYear
    })
  }, [records, search, filterMonth, filterYear])

  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-w-[200px]"
        />
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectClass}>
          <option value="">All months</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={selectClass}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {(search || filterMonth || filterYear) && (
          <button
            onClick={() => { setSearch(''); setFilterMonth(''); setFilterYear('') }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {records.length} records
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
          No payroll records found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Month / Year</th>
                <th className="px-4 py-3 font-medium text-right">Gross</th>
                <th className="px-4 py-3 font-medium text-right">Tax</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium">Generated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{record.employeeName}</td>
                  <td className="px-4 py-3 text-gray-600">{record.employeeCode}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {monthLabel(record.month)} {record.year}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(record.grossSalary)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(record.tax)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(record.netSalary)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(record.generatedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/payroll/slip/${record.id}`}
                        className="text-xs px-3 py-1.5 rounded-md border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition"
                      >
                        View Slip
                      </Link>
                      {showDelete && onDelete && (
                        <Button
                          variant="secondary"
                          loading={deletingId === record.id}
                          onClick={() => onDelete(record.id)}
                          className="text-xs py-1.5 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
