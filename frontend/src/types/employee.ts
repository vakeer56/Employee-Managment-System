
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
]


export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'

export const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
]

/** One row in the employee’s status audit trail (stored on the employee doc). */
export interface StatusHistoryEntry {
  status: EmployeeStatus
  changedAt: string
}

export interface Employee {
  id: string
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
  /** Optional audit trail when status changes (managed in employeeService). */
  statusHistory?: StatusHistoryEntry[]
  createdAt: string
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt'>
