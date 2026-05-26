import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logoutUser } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

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
          <Link to="/dashboard" className="text-lg font-semibold text-gray-900">
            HRMS
          </Link>
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
