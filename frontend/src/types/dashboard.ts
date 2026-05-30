import type { PayrollRecord } from './payroll'

export interface AdminDashboardStats {
  totalEmployees: number
  totalDepartments: number
  leaveStats: {
    total: number
    approved: number
    rejected: number
    pending: number
  }
  attendanceOverview: {
    presentToday: number
    absentToday: number
    attendancePercentage: number
  }
  departmentDistribution: {
    department: string
    count: number
  }[]
  leaveAnalytics: {
    byStatus: {
      approved: number
      rejected: number
      pending: number
    }
    byType: {
      casual: number
      sick: number
      earned: number
      wfh: number
    }
  }
  payrollAnalytics: {
    totalCost: number
    averageSalary: number
    departmentTotals: {
      department: string
      total: number
    }[]
  }
}

export interface EmployeeDashboardStats {
  leaveBalance: {
    casual: number
    sick: number
    earned: number
    wfh: number
  }
  attendanceStatus: {
    checkedInToday: boolean
    checkInTime: string | null
    checkOutTime: string | null
    monthlyPercentage: number
  }
  latestPayroll: PayrollRecord | null
}

export interface NotificationRecord {
  id: string
  employeeId: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
}
