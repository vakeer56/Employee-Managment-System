import { useAuth } from '../hooks/useAuth'
import { AdminDashboard } from '../components/dashboard/AdminDashboard'
import { EmployeeDashboard } from '../components/dashboard/EmployeeDashboard'

export function DashboardPage() {
  const { profile } = useAuth()

  if (!profile) return null

  // Route to Admin or Employee dashboard based on role
  if (profile.role === 'super_admin' || profile.role === 'hr_admin') {
    return <AdminDashboard />
  }

  return <EmployeeDashboard />
}
