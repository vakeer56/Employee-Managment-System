import { useEffect, useState } from 'react'
import {
  EmployeeForm,
  type EmployeeFormValues,
} from '../../components/employees/EmployeeForm'
import { Button } from '../../components/ui/Button'
import {
  addEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '../../services/employeeService'
import { getOrgSettings } from '../../services/orgSettingsService'
import type { Employee, EmployeeInput } from '../../types/employee'

function buildEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    employeeId: values.employeeId.trim(),
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    department: values.department.trim(),
    designation: values.designation.trim(),
    managerId: values.managerId.trim(),
    joiningDate: values.joiningDate.trim(),
    employmentType: values.employmentType,
    workLocation: values.workLocation.trim(),
    status: values.status,
    dateOfBirth: values.dateOfBirth.trim(),
    role: values.role,
  }
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [orgDepartments, setOrgDepartments] = useState<string[]>([])
  const [orgDesignations, setOrgDesignations] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  async function refreshEmployees() {
    try {
      const [data, org] = await Promise.all([getEmployees(), getOrgSettings()])
      setEmployees(data)
      setOrgDepartments(org.departments)
      setOrgDesignations(org.designations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees.')
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([getEmployees(), getOrgSettings()])
      .then(([data, org]) => {
        if (cancelled) return
        setEmployees(data)
        setOrgDepartments(org.departments)
        setOrgDesignations(org.designations)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load employees.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleAddClick() {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  function handleEditClick(employee: Employee) {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  function handleCancelForm() {
    setFormOpen(false)
    setEditingEmployee(null)
  }

  async function handleFormSubmit(values: EmployeeFormValues) {
    setSaving(true)
    setError('')
    try {
      const input = buildEmployeeInput(values)
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, input)
      } else {
        await addEmployee(input)
      }
      setFormOpen(false)
      setEditingEmployee(null)
      await refreshEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteClick(employee: Employee) {
    const confirmed = window.confirm(
      `Delete ${employee.name}? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(employee.id)
    setError('')
    try {
      await deleteEmployee(employee.id)
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage employee records
          </p>
        </div>
        {!formOpen && (
          <Button onClick={handleAddClick}>Add Employee</Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {formOpen && (
        <EmployeeForm
          key={editingEmployee?.id ?? 'new'}
          employee={editingEmployee}
          employeeOptions={employees}
          departmentOptions={orgDepartments}
          designationOptions={orgDesignations}
          loading={saving}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-600">Loading employees...</p>
      ) : employees.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
          No employees yet. Click &quot;Add Employee&quot; to create one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last status change</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{employee.employeeId}</td>
                  <td className="px-4 py-3">{employee.name}</td>
                  <td className="px-4 py-3">{employee.email}</td>
                  <td className="px-4 py-3">{employee.department}</td>
                  <td className="px-4 py-3">{employee.designation}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="capitalize">
                      {employee.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-gray-600">
                    {employee.statusHistory && employee.statusHistory.length > 0
                      ? new Date(
                          employee.statusHistory[
                            employee.statusHistory.length - 1
                          ].changedAt,
                        ).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEditClick(employee)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleDeleteClick(employee)}
                        loading={deletingId === employee.id}
                      >
                        Delete
                      </Button>
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
