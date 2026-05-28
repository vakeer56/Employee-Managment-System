import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logoutUser } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { hasRole } from '../utils/roles'

/** Main app shell after login (sidebar/header can grow here later) */
export function AppLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutUser()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-semibold text-gray-900">
              HRMS
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/leaves" className="text-gray-600 hover:text-gray-900">
                Leaves
              </Link>
              <Link to="/attendance" className="text-gray-600 hover:text-gray-900">
                Attendance
              </Link>
              <Link to="/org-chart" className="text-gray-600 hover:text-gray-900">
                Org Chart
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                My profile
              </Link>
              <Link to="/payroll/my" className="text-gray-600 hover:text-gray-900">
                My Payroll
              </Link>
              {hasRole(profile?.role, ['super_admin', 'hr_admin']) && (
                <Link to="/employees" className="text-gray-600 hover:text-gray-900">
                  Employees
                </Link>
              )}
              {hasRole(profile?.role, ['super_admin', 'hr_admin']) && (
                <Link to="/attendance/admin" className="text-gray-600 hover:text-gray-900">
                  Attendance Admin
                </Link>
              )}
              {hasRole(profile?.role, ['super_admin', 'hr_admin']) && (
                <Link to="/payroll" className="text-gray-600 hover:text-gray-900">
                  Payroll
                </Link>
              )}
              {hasRole(profile?.role, ['super_admin', 'hr_admin']) && (
                <Link to="/payroll/structures" className="text-gray-600 hover:text-gray-900">
                  Salary Structures
                </Link>
              )}
              {hasRole(profile?.role, ['super_admin', 'hr_admin']) && (
                <Link
                  to="/settings/org"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Org settings
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.displayName} ({profile?.role})
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
