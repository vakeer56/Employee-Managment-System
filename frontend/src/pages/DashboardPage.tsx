import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome, {profile?.displayName}. Your role is{' '}
        <span className="font-medium">{profile?.role}</span>.
      </p>
      <p className="mt-4 text-sm text-gray-500">
       welcome to Our Dashboard
      </p>
    </div>
  )
}
