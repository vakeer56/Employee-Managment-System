import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { AppLayout } from '../layouts/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected app pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Example: HR-only route (uncomment when you add HR pages) */}
            {/* <Route
              element={<ProtectedRoute allowedRoles={['super_admin', 'hr_admin']} />}
            >
              <Route path="/employees" element={<EmployeesPage />} />
            </Route> */}
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
