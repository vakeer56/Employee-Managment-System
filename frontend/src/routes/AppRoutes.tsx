import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { AppLayout } from '../layouts/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { DashboardPage } from '../pages/DashboardPage'
import { EmployeesPage } from '../pages/employees/EmployeesPage'
import { MyProfilePage } from '../pages/profile/MyProfilePage'
import { OrgSettingsPage } from '../pages/settings/OrgSettingsPage'
import { LeaveDashboardPage } from '../pages/leave/LeaveDashboardPage'
import AttendancePage from '../pages/attendance/AttendancePage'
import AdminAttendanceDashboard from '../pages/attendance/AdminAttendanceDashboard'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected app pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leaves" element={<LeaveDashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            <Route
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'hr_admin']} />
              }
            >
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/settings/org" element={<OrgSettingsPage />} />
              <Route path="/attendance/admin" element={<AdminAttendanceDashboard />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
