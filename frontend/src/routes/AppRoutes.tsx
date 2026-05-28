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
import OrganizationChartPage from '../pages/orgChart/OrganizationChartPage'
import { SeedDataPage } from '../pages/admin/SeedDataPage'
import { PayrollPage } from '../pages/payroll/PayrollPage'
import { SalaryStructuresPage } from '../pages/payroll/SalaryStructuresPage'
import { SalarySlipPage } from '../pages/payroll/SalarySlipPage'
import { MyPayrollPage } from '../pages/payroll/MyPayrollPage'

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
            <Route path="/org-chart" element={<OrganizationChartPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
            {/* Payroll — all authenticated employees can see their own */}
            <Route path="/payroll/my" element={<MyPayrollPage />} />
            <Route path="/payroll/slip/:id" element={<SalarySlipPage />} />
            <Route
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'hr_admin']} />
              }
            >
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/settings/org" element={<OrgSettingsPage />} />
              <Route path="/attendance/admin" element={<AdminAttendanceDashboard />} />
              {/* Payroll admin */}
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/payroll/structures" element={<SalaryStructuresPage />} />
            </Route>

            {/* Super-admin only: dev tools */}
            <Route
              element={<ProtectedRoute allowedRoles={['super_admin']} />}
            >
              <Route path="/admin/seed-data" element={<SeedDataPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
