export type NotificationType = 'leave' | 'payroll' | 'birthday' | 'anniversary' | 'announcement' | 'system'

export interface NotificationRecord {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  createdBy: string
}

export interface NotificationInput {
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead?: boolean
  createdBy?: string
}
