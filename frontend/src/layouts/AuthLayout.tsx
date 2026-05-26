import { Outlet } from 'react-router-dom'

/** Centered layout for login / register pages */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}
