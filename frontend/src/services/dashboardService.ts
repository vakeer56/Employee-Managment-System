import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { getOrgSettings } from './orgSettingsService'
import type { AdminDashboardStats, EmployeeDashboardStats, NotificationRecord } from '../types/dashboard'
import type { Employee } from '../types/employee'
import type { LeaveRequest } from '../types/leave'
import type { AttendanceRecord } from './attendanceService'
import type { PayrollRecord } from '../types/payroll'
import { getOrInitializeLeaveBalance } from './leaveService'

const getTodayDateString = (): string => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  // Fetch employees
  const employeesSnap = await getDocs(collection(db, 'employees'))
  const employees = employeesSnap.docs.map(doc => doc.data() as Employee)

  // Fetch departments
  const orgSettings = await getOrgSettings()

  // Fetch leaves
  const leavesSnap = await getDocs(collection(db, 'leaves'))
  const leaves = leavesSnap.docs.map(doc => doc.data() as LeaveRequest)

  // Fetch today's attendance
  const todayStr = getTodayDateString()
  const attendanceQ = query(collection(db, 'attendance'), where('date', '==', todayStr))
  const attendanceSnap = await getDocs(attendanceQ)
  const todayAttendance = attendanceSnap.docs.map(doc => doc.data() as AttendanceRecord)

  // Fetch payroll (current year)
  const thisYear = new Date().getFullYear()
  const payrollQ = query(collection(db, 'payroll'), where('year', '==', thisYear))
  const payrollSnap = await getDocs(payrollQ)
  const payrolls = payrollSnap.docs.map(doc => doc.data() as PayrollRecord)

  // Calculate Employee Distribution
  const departmentCounts: Record<string, number> = {}
  employees.forEach(emp => {
    const dept = emp.department || 'Unassigned'
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1
  })

  // Leave stats
  let approvedLeaves = 0
  let rejectedLeaves = 0
  let pendingLeaves = 0

  let casualLeaves = 0
  let sickLeaves = 0
  let earnedLeaves = 0
  let wfhLeaves = 0

  leaves.forEach(leave => {
    if (leave.status === 'APPROVED') approvedLeaves++
    else if (leave.status === 'REJECTED') rejectedLeaves++
    else pendingLeaves++

    if (leave.type === 'CASUAL') casualLeaves++
    else if (leave.type === 'SICK') sickLeaves++
    else if (leave.type === 'EARNED') earnedLeaves++
    else if (leave.type === 'WFH') wfhLeaves++
  })

  // Attendance stats
  let presentCount = 0
  todayAttendance.forEach(a => {
    if (a.status === 'Present' || a.status === 'Late') presentCount++
  })
  const totalActiveEmployees = employees.length // Assuming all are active for simplicity
  const absentCount = totalActiveEmployees - presentCount
  const attendancePercentage = totalActiveEmployees > 0 ? (presentCount / totalActiveEmployees) * 100 : 0

  // Payroll stats
  let totalPayrollCost = 0
  const deptPayroll: Record<string, number> = {}
  
  payrolls.forEach(p => {
    totalPayrollCost += p.netSalary
    const dept = p.department || 'Unassigned'
    deptPayroll[dept] = (deptPayroll[dept] || 0) + p.netSalary
  })

  const averageSalary = payrolls.length > 0 ? totalPayrollCost / payrolls.length : 0

  return {
    totalEmployees: employees.length,
    totalDepartments: orgSettings.departments.length,
    leaveStats: {
      total: leaves.length,
      approved: approvedLeaves,
      rejected: rejectedLeaves,
      pending: pendingLeaves
    },
    attendanceOverview: {
      presentToday: presentCount,
      absentToday: Math.max(0, absentCount),
      attendancePercentage: Math.round(attendancePercentage)
    },
    departmentDistribution: Object.entries(departmentCounts).map(([department, count]) => ({ department, count })),
    leaveAnalytics: {
      byStatus: {
        approved: approvedLeaves,
        rejected: rejectedLeaves,
        pending: pendingLeaves
      },
      byType: {
        casual: casualLeaves,
        sick: sickLeaves,
        earned: earnedLeaves,
        wfh: wfhLeaves
      }
    },
    payrollAnalytics: {
      totalCost: totalPayrollCost,
      averageSalary: averageSalary,
      departmentTotals: Object.entries(deptPayroll).map(([department, total]) => ({ department, total }))
    }
  }
}

export async function getEmployeeDashboardData(employeeId: string): Promise<EmployeeDashboardStats> {
  // Fetch leave balances
  const leaveBalance = await getOrInitializeLeaveBalance(employeeId)
  const balances = {
    casual: leaveBalance?.casualLeave ?? 0,
    sick: leaveBalance?.sickLeave ?? 0,
    earned: leaveBalance?.earnedLeave ?? 0,
    wfh: leaveBalance?.wfh ?? 0
  }

  // Fetch today's attendance
  const todayStr = getTodayDateString()
  const attendanceQ = query(
    collection(db, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '==', todayStr)
  )
  const attSnap = await getDocs(attendanceQ)
  let checkedInToday = false
  let checkInTime = null
  let checkOutTime = null

  if (!attSnap.empty) {
    const record = attSnap.docs[0].data() as AttendanceRecord
    checkedInToday = !!record.checkIn
    checkInTime = record.checkIn
    checkOutTime = record.checkOut
  }

  // Monthly percentage (mock logic - just fetch all for the month)
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const monthPrefix = `${yyyy}-${mm}`
  const monthAttQ = query(collection(db, 'attendance'), where('employeeId', '==', employeeId))
  const monthAttSnap = await getDocs(monthAttQ)
  
  let daysPresentThisMonth = 0
  let totalLogsThisMonth = 0
  monthAttSnap.forEach(doc => {
    const data = doc.data() as AttendanceRecord
    if (data.date.startsWith(monthPrefix)) {
      totalLogsThisMonth++
      if (data.status === 'Present' || data.status === 'Late') daysPresentThisMonth++
    }
  })
  
  // A simplistic month percentage (assuming 20 working days for now, or just against total logs)
  const monthlyPercentage = totalLogsThisMonth > 0 ? (daysPresentThisMonth / totalLogsThisMonth) * 100 : 0

  // Fetch latest payroll
  const payrollQ = query(collection(db, 'payroll'), where('employeeId', '==', employeeId))
  const payrollSnap = await getDocs(payrollQ)
  const payrolls = payrollSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollRecord))
  
  payrolls.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  return {
    leaveBalance: balances,
    attendanceStatus: {
      checkedInToday,
      checkInTime,
      checkOutTime,
      monthlyPercentage: Math.round(monthlyPercentage)
    },
    latestPayroll: payrolls[0] ?? null
  }
}

export async function getEmployeeNotifications(employeeId: string): Promise<NotificationRecord[]> {
  try {
    const notifQ = query(collection(db, 'notifications'), where('employeeId', '==', employeeId))
    const notifSnap = await getDocs(notifQ)
    return notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationRecord))
  } catch {
    return [] // Collection might not exist yet
  }
}

/**
 * Set up a real-time listener for admin dashboard stats
 * This listener will call the callback whenever leaves data changes
 */
export function subscribeToAdminDashboardStats(
  callback: (stats: AdminDashboardStats) => void,
  onError?: (error: Error) => void
) {
  // Subscribe to leaves collection for real-time updates
  const unsubscribe = onSnapshot(
    collection(db, 'leaves'),
    async (snapshot) => {
      try {
        // When leaves change, refetch all dashboard stats
        const stats = await getAdminDashboardStats()
        callback(stats)
      } catch (err) {
        if (onError) {
          onError(err instanceof Error ? err : new Error('Failed to update dashboard'))
        }
      }
    },
    (err) => {
      if (onError) {
        onError(err instanceof Error ? err : new Error('Listener error'))
      }
    }
  )

  return unsubscribe
}
