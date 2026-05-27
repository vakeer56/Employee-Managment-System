export const LeaveType = {
  CASUAL: 'CASUAL',
  SICK: 'SICK',
  EARNED: 'EARNED',
  WFH: 'WFH'
} as const;

export type LeaveType = typeof LeaveType[keyof typeof LeaveType];

export const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type LeaveStatus = typeof LeaveStatus[keyof typeof LeaveStatus];

export interface LeaveRequest {
  id?: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string; // ISO string format
  endDate: string; // ISO string format
  reason: string;
  status: LeaveStatus;
  appliedOn: string; // ISO string format
  managerId?: string; // ID of the manager who needs to approve
  managerRemarks?: string;
}

export interface LeaveBalance {
  id?: string;
  employeeId: string;
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  wfh: number;
}

export interface Holiday {
  id?: string;
  name: string;
  date: string; // ISO string format
}
