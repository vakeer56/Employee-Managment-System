import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  type Employee,
  type EmployeeStatus,
  type EmploymentType,
} from '../../types/employee'

/** Fields collected by this form (HR create/edit). */
export interface EmployeeFormValues {
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  designation: string
  managerId: string
  joiningDate: string
  employmentType: EmploymentType
  workLocation: string
  status: EmployeeStatus
}

interface EmployeeFormProps {
  employee?: Employee | null
  departmentOptions?: string[]
  designationOptions?: string[]
  /** HR can change employment status; defaults to true on Employees page. */
  showStatusField?: boolean
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

const emptyValues: EmployeeFormValues = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  managerId: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  employmentType: 'full_time',
  workLocation: '',
  status: 'active',
}

function valuesFromEmployee(employee: Employee): EmployeeFormValues {
  return {
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    designation: employee.designation,
    managerId: employee.managerId,
    joiningDate: employee.joiningDate || new Date().toISOString().slice(0, 10),
    employmentType: employee.employmentType,
    workLocation: employee.workLocation,
    status: employee.status,
  }
}

function validate(
  values: EmployeeFormValues,
): Partial<Record<keyof EmployeeFormValues, string>> {
  const errors: Partial<Record<keyof EmployeeFormValues, string>> = {}

  if (!values.employeeId.trim()) errors.employeeId = 'Employee ID is required.'
  if (!values.name.trim()) errors.name = 'Name is required.'
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.phone.trim()) errors.phone = 'Phone is required.'
  if (!values.department.trim()) errors.department = 'Department is required.'
  if (!values.designation.trim()) errors.designation = 'Designation is required.'
  if (!values.workLocation.trim()) errors.workLocation = 'Work location is required.'
  if (!values.joiningDate.trim()) errors.joiningDate = 'Joining date is required.'

  return errors
}

export function EmployeeForm({
  employee,
  departmentOptions = [],
  designationOptions = [],
  showStatusField = true,
  onSubmit,
  onCancel,
  loading = false,
}: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>(
    employee ? valuesFromEmployee(employee) : emptyValues,
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof EmployeeFormValues, string>>
  >({})

  function updateField<K extends keyof EmployeeFormValues>(
    field: K,
    value: EmployeeFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    await onSubmit(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        {employee ? 'Edit Employee' : 'Add Employee'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Employee ID"
          name="employeeId"
          value={values.employeeId}
          onChange={(e) => updateField('employeeId', e.target.value)}
          error={errors.employeeId}
          placeholder="e.g. EMP-001"
          required
        />
        <Input
          label="Joining date"
          name="joiningDate"
          type="date"
          value={values.joiningDate}
          onChange={(e) => updateField('joiningDate', e.target.value)}
          error={errors.joiningDate}
          required
        />
        <Input
          label="Full name"
          name="name"
          value={values.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          error={errors.phone}
          required
        />
        <Input
          label="Manager ID (optional)"
          name="managerId"
          value={values.managerId}
          onChange={(e) => updateField('managerId', e.target.value)}
          placeholder="Firestore doc id of manager"
        />
        <div>
          <Input
            label="Department"
            name="department"
            list={departmentOptions.length > 0 ? 'department-options' : undefined}
            value={values.department}
            onChange={(e) => updateField('department', e.target.value)}
            error={errors.department}
            required
          />
          {departmentOptions.length > 0 && (
            <datalist id="department-options">
              {departmentOptions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          )}
        </div>
        <div>
          <Input
            label="Designation"
            name="designation"
            list={designationOptions.length > 0 ? 'designation-options' : undefined}
            value={values.designation}
            onChange={(e) => updateField('designation', e.target.value)}
            error={errors.designation}
            required
          />
          {designationOptions.length > 0 && (
            <datalist id="designation-options">
              {designationOptions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          )}
        </div>
        <Input
          label="Work location"
          name="workLocation"
          value={values.workLocation}
          onChange={(e) => updateField('workLocation', e.target.value)}
          error={errors.workLocation}
          required
        />
        <div className="space-y-1">
          <label
            htmlFor="employmentType"
            className="block text-sm font-medium text-gray-700"
          >
            Employment type
          </label>
          <select
            id="employmentType"
            value={values.employmentType}
            onChange={(e) =>
              updateField('employmentType', e.target.value as EmploymentType)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {showStatusField && (
          <div className="space-y-1">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              value={values.status}
              onChange={(e) =>
                updateField('status', e.target.value as EmployeeStatus)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {employee ? 'Save changes' : 'Add employee'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
