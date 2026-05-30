import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getEmployees } from '../employeeService'
import { createNotification } from './notificationService'
import { sendEmail, emailTemplates } from './emailService'

const ANNOUNCEMENTS_COLLECTION = 'announcements'

export interface Announcement {
  id: string
  title: string
  message: string
  audience: string // 'all' | 'managers' | 'hr_admins' | string (dept name)
  createdAt: string
  createdBy: string
}

export type AnnouncementInput = Omit<Announcement, 'id' | 'createdAt'>

function toAnnouncement(id: string, data: DocumentData): Announcement {
  const createdAt = data.createdAt
  return {
    id,
    title: data.title ?? '',
    message: data.message ?? '',
    audience: data.audience ?? 'all',
    createdBy: data.createdBy ?? 'system',
    createdAt:
      typeof createdAt === 'string'
        ? createdAt
        : createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

/** Get all system announcements, sorted by date (newest first) */
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const q = query(collection(db, ANNOUNCEMENTS_COLLECTION), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => toAnnouncement(d.id, d.data()))
  } catch (error) {
    console.error('Error fetching announcements:', error)
    throw new Error('Failed to load announcements')
  }
}

/**
 * Create a new announcement, save it to the announcements collection,
 * and automatically generate notifications and mock emails for the target audience.
 */
export async function createAnnouncement(
  input: AnnouncementInput,
  authorName: string
): Promise<Announcement> {
  try {
    // 1. Add announcement document to Firestore
    const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
      title: input.title,
      message: input.message,
      audience: input.audience,
      createdBy: authorName,
      createdAt: serverTimestamp(),
    })

    const newAnnouncement: Announcement = {
      id: docRef.id,
      title: input.title,
      message: input.message,
      audience: input.audience,
      createdBy: authorName,
      createdAt: new Date().toISOString(),
    }

    // 2. Generate notifications for target users asynchronously
    ;(async () => {
      try {
        const employees = await getEmployees()
        const activeEmployees = employees.filter((e) => e.status === 'active')
        let targetEmployees = activeEmployees

        // Determine targets based on audience
        if (input.audience === 'managers') {
          targetEmployees = activeEmployees.filter(
            (e) => e.role === 'manager' || e.role === 'hr_admin' || e.role === 'super_admin'
          )
        } else if (input.audience === 'hr_admins') {
          targetEmployees = activeEmployees.filter(
            (e) => e.role === 'hr_admin' || e.role === 'super_admin'
          )
        } else if (input.audience !== 'all') {
          // It's a specific department
          targetEmployees = activeEmployees.filter(
            (e) => (e.department || '').trim().toLowerCase() === input.audience.trim().toLowerCase()
          )
        }

        // Send notification & email to each target employee
        for (const emp of targetEmployees) {
          // Create in-app notification
          await createNotification({
            userId: emp.id,
            title: `Announcement: ${input.title}`,
            message: input.message,
            type: 'announcement',
            createdBy: authorName,
          })

          // Send mock email
          if (emp.email) {
            await sendEmail(
              emailTemplates.announcement(emp.email, input.title, input.message, authorName)
            )
          }
        }
      } catch (err) {
        console.error('Failed to dispatch announcement notifications:', err)
      }
    })()

    return newAnnouncement;
  } catch (error) {
    console.error('Error creating announcement:', error)
    throw new Error('Failed to publish announcement')
  }
}

/** Update an existing announcement */
export async function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>
): Promise<void> {
  try {
    const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id)
    await updateDoc(ref, input)
  } catch (error) {
    console.error('Error updating announcement:', error)
    throw new Error('Failed to update announcement')
  }
}

/** Delete an announcement */
export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const ref = doc(db, ANNOUNCEMENTS_COLLECTION, id)
    await deleteDoc(ref)
  } catch (error) {
    console.error('Error deleting announcement:', error)
    throw new Error('Failed to delete announcement')
  }
}
