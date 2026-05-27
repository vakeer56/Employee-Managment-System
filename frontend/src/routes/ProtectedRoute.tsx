import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { hasRole } from '../utils/roles'
import type { UserRole } from '../types/user'

interface ProtectedRouteProps {
  /** If set, only these roles can access the route */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { firebaseUser, profile, loading, profileError } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading...
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            Profile access blocked
          </h1>
          <p className="mt-2 text-sm text-gray-600">{profileError}</p>
        </div>
      </div>
    )
  }

  if (allowedRoles && !hasRole(profile?.role, allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
