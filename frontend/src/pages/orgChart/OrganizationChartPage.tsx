import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  getEmployeesForOrg,
  buildHierarchy,
  searchEmployees,
  getAncestorIds,
  getDepartments,
} from '../../services/orgChartService'
import type { Employee } from '../../types/employee'
import { OrgTree } from '../../components/orgChart/OrgTree'
import { DepartmentFilter } from '../../components/orgChart/DepartmentFilter'
import { SearchBar } from '../../components/orgChart/SearchBar'
import { useAuth } from '../../hooks/useAuth'
import { hasRole } from '../../utils/roles'

/**
 * OrganizationChartPage
 *
 * Flow:
 * 1. Fetch all employees from Firestore once on mount.
 * 2. Apply department filter → filtered employee list.
 * 3. Build hierarchy tree from filtered list.
 * 4. Apply search → get matched ids + ancestor ids (for auto-expand).
 * 5. Pass everything to OrgTree for rendering.
 *
 * When a manager is reassigned (drag & drop), we re-fetch to keep
 * the tree in sync with Firestore.
 */
export default function OrganizationChartPage() {
  const { profile } = useAuth()
  const isManagement = hasRole(profile?.role, ['super_admin', 'hr_admin', 'manager'])

  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('')

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEmployeesForOrg()
      setAllEmployees(data)
    } catch {
      setError('Failed to load employees. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // ── Derived data (all memoized to avoid recalculation on every render) ───
  const departments = useMemo(() => getDepartments(allEmployees), [allEmployees])

  /** Employees filtered by selected department */
  const filteredEmployees = useMemo(() => {
    if (!selectedDept) return allEmployees
    return allEmployees.filter((e) => e.department === selectedDept)
  }, [allEmployees, selectedDept])

  /** Hierarchy tree built from filtered employees */
  const roots = useMemo(() => buildHierarchy(filteredEmployees), [filteredEmployees])

  /** IDs of employees matching the search term */
  const matchedIds = useMemo(
    () => searchEmployees(filteredEmployees, searchTerm),
    [filteredEmployees, searchTerm],
  )

  /** IDs of ancestors of matched employees (for auto-expand) */
  const ancestorIds = useMemo(
    () => getAncestorIds(filteredEmployees, matchedIds),
    [filteredEmployees, matchedIds],
  )

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalManagers = useMemo(
    () =>
      filteredEmployees.filter((e) =>
        filteredEmployees.some((other) => other.managerId === e.id),
      ).length,
    [filteredEmployees],
  )

  const topLevelCount = roots.length

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Chart</h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore the company hierarchy, reporting lines, and team structure.
        </p>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Employees', value: filteredEmployees.length, icon: '👥' },
            { label: 'Departments', value: departments.length, icon: '🏢' },
            { label: 'Managers', value: totalManagers, icon: '👔' },
            { label: 'Top-level Nodes', value: topLevelCount, icon: '🌳' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3"
            >
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={matchedIds.size}
          />
          {isManagement && (
            <p className="text-xs text-gray-400 italic">
              ⠿ Drag a card and drop it onto a manager to reassign
            </p>
          )}
        </div>
        <DepartmentFilter
          departments={departments}
          selected={selectedDept}
          onChange={setSelectedDept}
        />
      </div>

      {/* Search result notice */}
      {searchTerm && matchedIds.size === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-xl px-4 py-3">
          No employees matched "<strong>{searchTerm}</strong>". Try a different name, role, or department.
        </div>
      )}
      {searchTerm && matchedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-xl px-4 py-3">
          Found <strong>{matchedIds.size}</strong> employee
          {matchedIds.size !== 1 ? 's' : ''} matching "<strong>{searchTerm}</strong>". Their managers are auto-expanded.
        </div>
      )}

      {/* Tree */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading organization chart…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchEmployees}
              className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <OrgTree
            roots={roots}
            matchedIds={matchedIds}
            ancestorIds={ancestorIds}
            isManagement={isManagement}
            onManagerUpdated={fetchEmployees}
          />
        )}
      </div>
    </div>
  )
}
