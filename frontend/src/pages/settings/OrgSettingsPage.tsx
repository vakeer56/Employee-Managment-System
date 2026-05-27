import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  addDepartment,
  addDesignation,
  getOrgSettings,
  removeDepartment,
  removeDesignation,
} from '../../services/orgSettingsService'

export function OrgSettingsPage() {
  const [departments, setDepartments] = useState<string[]>([])
  const [designations, setDesignations] = useState<string[]>([])
  const [newDepartment, setNewDepartment] = useState('')
  const [newDesignation, setNewDesignation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function refresh() {
    const org = await getOrgSettings()
    setDepartments(org.departments)
    setDesignations(org.designations)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        await refresh()
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load settings.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAddDepartment(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await addDepartment(newDepartment)
      setNewDepartment('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add department.')
    }
  }

  async function handleAddDesignation(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await addDesignation(newDesignation)
      setNewDesignation('')
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not add designation.',
      )
    }
  }

  async function handleRemoveDepartment(name: string) {
    if (!window.confirm(`Remove department "${name}"?`)) return
    setError('')
    try {
      await removeDepartment(name)
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not remove department.',
      )
    }
  }

  async function handleRemoveDesignation(name: string) {
    if (!window.confirm(`Remove designation "${name}"?`)) return
    setError('')
    try {
      await removeDesignation(name)
      await refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not remove designation.',
      )
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Loading organization settings...</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Departments & designations
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Lists used on the employee form (suggestions via datalist). You can
          still type values not in the list.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">Departments</h2>
          <form onSubmit={handleAddDepartment} className="mt-4 space-y-3">
            <Input
              label="New department"
              name="newDepartment"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
            />
            <Button type="submit">Add department</Button>
          </form>
          <ul className="mt-4 divide-y divide-gray-100 text-sm">
            {departments.length === 0 ? (
              <li className="py-2 text-gray-500">No departments yet.</li>
            ) : (
              departments.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span>{name}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRemoveDepartment(name)}
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900">Designations</h2>
          <form onSubmit={handleAddDesignation} className="mt-4 space-y-3">
            <Input
              label="New designation"
              name="newDesignation"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
            />
            <Button type="submit">Add designation</Button>
          </form>
          <ul className="mt-4 divide-y divide-gray-100 text-sm">
            {designations.length === 0 ? (
              <li className="py-2 text-gray-500">No designations yet.</li>
            ) : (
              designations.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span>{name}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRemoveDesignation(name)}
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
