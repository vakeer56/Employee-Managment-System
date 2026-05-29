import { useState, useEffect, useCallback } from 'react'
import {
  getAdminDashboardStats,
  getEmployeeDashboardData,
  getEmployeeNotifications,
  subscribeToAdminDashboardStats
} from '../services/dashboardService'
import type { AdminDashboardStats, EmployeeDashboardStats, NotificationRecord } from '../types/dashboard'
import { useDashboardRefresh } from '../context/DashboardRefreshContext'

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { refreshCount } = useDashboardRefresh()

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAdminDashboardStats()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load admin dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    // Set up real-time listener for leaves
    const unsubscribe = subscribeToAdminDashboardStats(
      (newStats) => {
        if (mounted) {
          setStats(newStats)
          setError(null)
          setLoading(false)
        }
      },
      (err) => {
        if (mounted) {
          console.error(err)
          setError('Failed to load admin dashboard statistics.')
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // Refetch when dashboard refresh is triggered manually
  useEffect(() => {
    if (refreshCount > 0) {
      refetch()
    }
  }, [refreshCount, refetch])

  return { stats, loading, error, refetch }
}

export function useEmployeeDashboard(employeeId: string) {
  const [stats, setStats] = useState<EmployeeDashboardStats | null>(null)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!employeeId) {
      setLoading(false)
      return
    }

    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const [data, notifs] = await Promise.all([
          getEmployeeDashboardData(employeeId),
          getEmployeeNotifications(employeeId)
        ])
        if (mounted) {
          setStats(data)
          setNotifications(notifs)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          console.error(err)
          setError('Failed to load your dashboard data.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [employeeId])

  return { stats, notifications, loading, error }
}
