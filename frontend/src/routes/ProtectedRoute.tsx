import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { hasRole } from '../utils/roles'
import type { UserRole } from '../types/user'

interface ProtectedRouteProps {
  /** If set, only these roles can access the route */
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { firebaseUser, profile, loading } = useAuth()

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

  if (allowedRoles && !hasRole(profile?.role, allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
