import { useEffect, useState } from 'react'
import {
  subscribeToNotifications,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../../services/notifications/notificationService'
import type { NotificationRecord } from '../../types/notification'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToNotifications(
      userId,
      (data) => {
        setNotifications(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message || 'Failed to load notifications')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function markAsRead(notificationId: string) {
    try {
      await apiMarkAsRead(notificationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }

  async function markAllAsRead() {
    if (!userId) return
    try {
      await apiMarkAllAsRead(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await apiDeleteNotification(notificationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
export default useNotifications
