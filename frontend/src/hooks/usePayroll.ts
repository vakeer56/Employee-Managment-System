/**
 * usePayroll.ts
 *
 * Reusable hooks for payroll data fetching.
 * Follows the same pattern as the rest of the app — simple, no over-engineering.
 */

import { useState, useEffect, useCallback } from 'react'
import type { PayrollRecord, SalaryStructure } from '../types/payroll'
import {
  getPayrolls,
  getPayrollByEmployee,
  getSalaryStructure,
  getAllSalaryStructures,
  getPayrollAnalytics,
  type PayrollAnalytics,
} from '../services/payrollService'

// ─── useAllPayrolls ───────────────────────────────────────────────────────────
/** Fetch all payroll records (admin/HR view) */
export function useAllPayrolls() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPayrolls()
      setPayrolls(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payrolls.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { payrolls, loading, error, refresh }
}

// ─── useEmployeePayroll ───────────────────────────────────────────────────────
/** Fetch payroll records for a single employee (self-service view) */
export function useEmployeePayroll(employeeId: string | undefined) {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPayrollByEmployee(employeeId)
      setPayrolls(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your payroll.')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => { refresh() }, [refresh])

  return { payrolls, loading, error, refresh }
}

// ─── useSalaryStructure ───────────────────────────────────────────────────────
/** Fetch salary structure for one employee */
export function useSalaryStructure(employeeId: string | undefined) {
  const [structure, setStructure] = useState<SalaryStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!employeeId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const data = await getSalaryStructure(employeeId)
      setStructure(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load salary structure.')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => { refresh() }, [refresh])

  return { structure, loading, error, refresh }
}

// ─── useAllSalaryStructures ───────────────────────────────────────────────────
/** Fetch all salary structures (admin view) */
export function useAllSalaryStructures() {
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllSalaryStructures()
      setStructures(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load salary structures.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { structures, loading, error, refresh }
}

// ─── usePayrollAnalytics ──────────────────────────────────────────────────────
export function usePayrollAnalytics(month: number, year: number) {
  const [analytics, setAnalytics] = useState<PayrollAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPayrollAnalytics(month, year)
      .then((data) => { if (!cancelled) setAnalytics(data) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [month, year])

  return { analytics, loading, error }
}
