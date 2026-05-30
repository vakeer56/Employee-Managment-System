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
    console.log(`\n${'='.repeat(70)}\n[DEBUG-STEP1] ANNOUNCEMENT CREATION\n${'='.repeat(70)}`)
    console.log(`[DEBUG-STEP1] Input audience: "${input.audience}"`)
    console.log(`[DEBUG-STEP1] Creator (authorName): "${authorName}"`)
    
    const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
      title: input.title,
      message: input.message,
      audience: input.audience,
      createdBy: authorName,
      createdAt: serverTimestamp(),
    })
    console.log(`[DEBUG-STEP1] ✓ Announcement created with ID: "${docRef.id}"\n`)

    const newAnnouncement: Announcement = {
      id: docRef.id,
      title: input.title,
      message: input.message,
      audience: input.audience,
      createdBy: authorName,
      createdAt: new Date().toISOString(),
    }

    // 2. Generate notifications for target users
    // This is now properly awaited to ensure notifications are created
    await dispatchAnnouncementNotifications(docRef.id, input, authorName)

    return newAnnouncement
  } catch (error) {
    console.error('Error creating announcement:', error)
    throw new Error('Failed to publish announcement')
  }
}

/**
 * Dispatch notifications to all eligible users for an announcement.
 * This function is now separated and properly awaited.
 */
async function dispatchAnnouncementNotifications(
  announcementId: string,
  input: AnnouncementInput,
  authorName: string
): Promise<void> {
  try {
    console.log(`\n${'='.repeat(70)}\n[DEBUG-STEP2] AUDIENCE RESOLUTION\n${'='.repeat(70)}`)
    console.log(`[DEBUG-STEP2] Announcement ID: "${announcementId}"`)
    console.log(`[DEBUG-STEP2] Audience type from input: "${input.audience}"`)

    const employees = await getEmployees()
    console.log(`[DEBUG-STEP2] Total employees fetched: ${employees.length}`)
    
    const activeEmployees = employees.filter((e) => e.status === 'active')
    console.log(`[DEBUG-STEP2] Active employees: ${activeEmployees.length}`)
    
    if (activeEmployees.length > 0) {
      console.log(`[DEBUG-STEP2] Sample employee:`, {
        id: activeEmployees[0].id,
        name: activeEmployees[0].name,
        email: activeEmployees[0].email,
        role: activeEmployees[0].role,
        department: activeEmployees[0].department,
        status: activeEmployees[0].status,
      })
    }

    let targetEmployees = activeEmployees
    const audienceType = input.audience

    // Determine targets based on audience
    if (audienceType === 'managers') {
      targetEmployees = activeEmployees.filter(
        (e) => e.role === 'manager' || e.role === 'hr_admin' || e.role === 'super_admin'
      )
      console.log(`[DEBUG-STEP2] ✓ Filter: managers -> ${targetEmployees.length} employees`)
    } else if (audienceType === 'hr_admins') {
      targetEmployees = activeEmployees.filter(
        (e) => e.role === 'hr_admin' || e.role === 'super_admin'
      )
      console.log(`[DEBUG-STEP2] ✓ Filter: hr_admins -> ${targetEmployees.length} employees`)
    } else if (audienceType !== 'all') {
      // It's a specific department
      const deptLower = audienceType.trim().toLowerCase()
      targetEmployees = activeEmployees.filter(
        (e) => (e.department || '').trim().toLowerCase() === deptLower
      )
      console.log(`[DEBUG-STEP2] ✓ Filter: department "${audienceType}" -> ${targetEmployees.length} employees`)
    } else {
      console.log(`[DEBUG-STEP2] ✓ Filter: all employees -> ${targetEmployees.length} employees`)
    }
    
    console.log(`[DEBUG-STEP2] Target employee IDs: [${targetEmployees.map((e) => e.id).join(', ')}]\n`)

    // Send notification & email to each target employee
    let successCount = 0
    let failureCount = 0

    console.log(`${'='.repeat(70)}\n[DEBUG-STEP3] CREATING NOTIFICATIONS\n${'='.repeat(70)}`)
    for (const emp of targetEmployees) {
      try {
        console.log(`[DEBUG-STEP3] BEFORE write - userId: "${emp.id}", title: "Announcement: ${input.title}", type: "announcement"`)
        // Create in-app notification
        const notifResult = await createNotification({
          userId: emp.id,
          title: `Announcement: ${input.title}`,
          message: input.message,
          type: 'announcement',
          createdBy: authorName,
          announcementId: announcementId,
        })
        console.log(`[DEBUG-STEP3] ✓ AFTER write - notification ID: "${notifResult.id}" for employee: "${emp.id}" (${emp.email})`)
        successCount++

        // Send mock email
        if (emp.email) {
          await sendEmail(
            emailTemplates.announcement(emp.email, input.title, input.message, authorName)
          )
        }
      } catch (err) {
        failureCount++
        console.error(`[DEBUG-STEP3] ✗ FAILED for employee "${emp.id}":`, err)
      }
    }

    console.log(
      `\n${'='.repeat(70)}\n[DEBUG-STEP3] COMPLETE - Success: ${successCount}, Failed: ${failureCount}\n${'='.repeat(70)}\n`
    )
  } catch (err) {
    console.error('[Announcement] Failed to dispatch announcement notifications:', err)
    throw new Error('Failed to create notifications for announcement targets')
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
