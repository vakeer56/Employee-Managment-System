import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  getEmployeeByAuthEmail,
  updateOwnProfileFields,
} from '../../services/employeeProfileService'
import { useAuth } from '../../hooks/useAuth'
import { EMPLOYEE_STATUSES, type Employee } from '../../types/employee'

function statusLabel(value: string) {
  return EMPLOYEE_STATUSES.find((s) => s.value === value)?.label ?? value
}

export function MyProfilePage() {
  const { firebaseUser } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [workLocation, setWorkLocation] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!firebaseUser?.email) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const record = await getEmployeeByAuthEmail(firebaseUser.email)
        if (cancelled) return
        setEmployee(record)
        if (record) {
          setPhone(record.phone)
          setWorkLocation(record.workLocation)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load profile.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [firebaseUser?.email])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!employee) return
    setSaving(true)
    setError('')
    try {
      await updateOwnProfileFields(employee.id, { phone, workLocation })
      setEmployee((prev) =>
        prev
          ? { ...prev, phone: phone.trim(), workLocation: workLocation.trim() }
          : prev,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Loading profile...</p>
  }

  if (!firebaseUser?.email) {
    return <p className="text-sm text-gray-600">Sign in to view your profile.</p>
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No employee record matches your login email ({firebaseUser.email}). Ask
        HR to create an employee with this email so your profile can appear here.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your assignment and update contact details HR allows you to edit.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-900">Work details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Employee ID</dt>
            <dd className="font-medium text-gray-900">{employee.employeeId}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-gray-900">{employee.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{employee.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Department</dt>
            <dd className="font-medium text-gray-900">{employee.department}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Designation</dt>
            <dd className="font-medium text-gray-900">{employee.designation}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Current status</dt>
            <dd className="font-medium capitalize text-gray-900">
              {statusLabel(employee.status)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Joining date</dt>
            <dd className="font-medium text-gray-900">{employee.joiningDate}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-900">Status history</h2>
        <p className="mt-1 text-xs text-gray-500">
          Updates when HR changes your status on the Employees screen.
        </p>
        {!employee.statusHistory || employee.statusHistory.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No history recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {employee.statusHistory.map((entry, index) => (
              <li
                key={`${entry.changedAt}-${index}`}
                className="flex justify-between gap-4 border-b border-gray-100 py-2"
              >
                <span className="font-medium capitalize">
                  {statusLabel(entry.status)}
                </span>
                <span className="text-gray-500">
                  {new Date(entry.changedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-900">Editable fields</h2>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <Input
            label="Phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Work location"
            name="workLocation"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            required
          />
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
      </section>
    </div>
  )
}
