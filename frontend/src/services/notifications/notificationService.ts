import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { NotificationRecord, NotificationInput } from '../../types/notification'

const NOTIFICATIONS_COLLECTION = 'notifications'

function toNotificationRecord(id: string, data: DocumentData): NotificationRecord {
  const createdAt = data.createdAt
  return {
    id,
    userId: data.userId ?? '',
    title: data.title ?? '',
    message: data.message ?? '',
    type: data.type ?? 'system',
    isRead: data.isRead ?? false,
    createdAt:
      typeof createdAt === 'string'
        ? createdAt
        : createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    createdBy: data.createdBy ?? 'system',
    announcementId: data.announcementId,
  }
}

/** Create a notification document in Firestore */
export async function createNotification(input: NotificationInput): Promise<NotificationRecord> {
  try {
    console.log(`[DEBUG-CREATE-NOTIF] BEFORE write - userId: "${input.userId}", title: "${input.title}", type: "${input.type}", announcementId: "${input.announcementId}"`)
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: input.isRead ?? false,
      createdBy: input.createdBy ?? 'system',
      announcementId: input.announcementId,
      createdAt: serverTimestamp(),
    })
    console.log(`[DEBUG-CREATE-NOTIF] ✓ AFTER write - Document ID: "${docRef.id}"`)
    
    return {
      id: docRef.id,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: input.isRead ?? false,
      createdBy: input.createdBy ?? 'system',
      announcementId: input.announcementId,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[DEBUG-CREATE-NOTIF] ✗ ERROR:', error)
    throw new Error('Failed to create notification')
  }
}

/** Get all notifications for a specific user, sorted by date (newest first) */
export async function getNotifications(userId: string): Promise<NotificationRecord[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => toNotificationRecord(d.id, d.data()))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw new Error('Failed to load notifications')
  }
}

/** Mark a specific notification as read */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId)
    await updateDoc(ref, { isRead: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }
}

/** Mark all unread notifications for a specific user as read */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    )
    const snap = await getDocs(q)
    if (snap.empty) return

    const batch = writeBatch(db)
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { isRead: true })
    })
    await batch.commit()
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }
}

/** Delete a specific notification */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId)
    await deleteDoc(ref)
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

/** Set up a real-time listener for user notifications */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationRecord[]) => void,
  onError?: (error: Error) => void
) {
  console.log(`[DEBUG-QUERY] SUBSCRIBED for userId: "${userId}"`)
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snap) => {
      console.log(`[DEBUG-QUERY] Query returned ${snap.docs.length} documents for userId: "${userId}"`)
      if (snap.docs.length > 0) {
        console.log(`[DEBUG-QUERY] Sample doc:`, {
          id: snap.docs[0].id,
          userId: snap.docs[0].data().userId,
          title: snap.docs[0].data().title,
          type: snap.docs[0].data().type,
          isRead: snap.docs[0].data().isRead,
          announcementId: snap.docs[0].data().announcementId,
        })
      }
      const records = snap.docs.map((d) => toNotificationRecord(d.id, d.data()))
      callback(records)
    },
    (err) => {
      console.error('[DEBUG-QUERY] ✗ Subscription error:', err)
      if (onError) onError(err)
    }
  )
}
