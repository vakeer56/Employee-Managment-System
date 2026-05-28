/**
 * SalaryStructuresPage.tsx
 *
 * Admin/HR page to manage salary structures:
 *  - List all existing structures
 *  - Add a new structure (using SalaryStructureForm)
 *  - Edit an existing structure
 *  - Delete a structure
 *
 * Route: /payroll/structures  (super_admin, hr_admin only)
 */

import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { SalaryStructureForm } from '../../components/payroll/SalaryStructureForm'
import { useAllSalaryStructures } from '../../hooks/usePayroll'
import {
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
} from '../../services/payrollService'
import { getEmployees } from '../../services/employeeService'
import type { Employee } from '../../types/employee'
import type { SalaryStructure, SalaryStructureInput } from '../../types/payroll'
import { formatCurrency } from '../../types/payroll'

export function SalaryStructuresPage() {
  const { structures, loading, error, refresh } = useAllSalaryStructures()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SalaryStructure | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Load employees for the dropdown
  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(() => {})
  }, [])

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  // Employees that don't yet have a salary structure (for "Add" mode)
  const employeesWithoutStructure = employees.filter(
    (emp) => !structures.some((s) => s.employeeId === emp.id),
  )

  async function handleSubmit(input: SalaryStructureInput) {
    setSaving(true)
    try {
      if (editing) {
        await updateSalaryStructure(editing.id, input)
        showToast('success', 'Salary structure updated successfully.')
      } else {
        await createSalaryStructure(input)
        showToast('success', 'Salary structure created successfully.')
      }
      setFormOpen(false)
      setEditing(null)
      await refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete salary structure for ${name}? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteSalaryStructure(id)
      showToast('success', `Salary structure for ${name} deleted.`)
      await refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Salary Structures</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define basic pay, HRA, allowances, and tax for each employee.
          </p>
        </div>
        {!formOpen && (
          <Button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            disabled={employeesWithoutStructure.length === 0}
          >
            + Add Structure
          </Button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Error from hook */}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Form */}
      {formOpen && (
        <SalaryStructureForm
          existing={editing}
          employees={editing ? employees : employeesWithoutStructure}
          loading={saving}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-600">Loading salary structures…</p>
      ) : structures.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
          No salary structures yet. Click "Add Structure" to create one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium text-right">Basic Pay</th>
                <th className="px-4 py-3 font-medium text-right">HRA</th>
                <th className="px-4 py-3 font-medium text-right">Allowances</th>
                <th className="px-4 py-3 font-medium text-right">Deductions</th>
                <th className="px-4 py-3 font-medium text-right">Tax %</th>
                <th className="px-4 py-3 font-medium text-right">Est. Net</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => {
                const gross = s.basicPay + s.hra + s.allowances
                const tax = Math.round(gross * (s.taxPercentage / 100))
                const net = gross - tax - s.deductions
                return (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.employeeName}</p>
                      <p className="text-xs text-gray-500">{s.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.basicPay)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.hra)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.allowances)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(s.deductions)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{s.taxPercentage}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(net)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => { setEditing(s); setFormOpen(true) }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          loading={deletingId === s.id}
                          onClick={() => handleDelete(s.id, s.employeeName)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
