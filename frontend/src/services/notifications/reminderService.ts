import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { getEmployees } from '../employeeService'
import { createNotification } from './notificationService'
import { sendEmail, emailTemplates } from './emailService'

/**
 * Normalizes a date string or object to local YYYY-MM-DD
 */
function getTodayMonthDay(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

/** Check if a notification of a specific type has already been generated for this user this year. */
async function hasNotificationForThisYear(userId: string, type: 'birthday' | 'anniversary'): Promise<boolean> {
  const currentYear = new Date().getFullYear()
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('type', '==', type)
  )

  const snap = await getDocs(q)
  if (snap.empty) return false

  return snap.docs.some((docSnap) => {
    const data = docSnap.data()
    const createdAtStr =
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt?.toDate?.()?.toISOString() ?? ''
    if (!createdAtStr) return false
    const notificationYear = new Date(createdAtStr).getFullYear()
    return notificationYear === currentYear
  })
}

/**
 * checkBirthdays
 * Iterates through all active employees, checks if today matches their birthday,
 * and generates a notification & mock email if not already created this year.
 */
export async function checkBirthdays(): Promise<{ checked: number; generated: number }> {
  try {
    const employees = await getEmployees()
    const activeEmployees = employees.filter((e) => e.status === 'active')
    const todayMMDD = getTodayMonthDay()
    let generatedCount = 0

    for (const emp of activeEmployees) {
      // @ts-ignore (dateOfBirth is optional/added dynamically)
      const dob = emp.dateOfBirth
      if (!dob || typeof dob !== 'string' || dob.length < 10) continue

      const empMMDD = dob.slice(5, 10) // Extracts MM-DD from YYYY-MM-DD
      if (empMMDD === todayMMDD) {
        const alreadyNotified = await hasNotificationForThisYear(emp.id, 'birthday')
        if (!alreadyNotified) {
          // 1. Create Firestore notification
          await createNotification({
            userId: emp.id,
            title: 'Happy Birthday! 🎂',
            message: `Wishing you a very Happy Birthday, ${emp.name}! Have a wonderful day ahead.`,
            type: 'birthday',
            createdBy: 'system',
          })

          // 2. Send mock email
          if (emp.email) {
            await sendEmail(emailTemplates.birthdayGreeting(emp.email, emp.name))
          }

          generatedCount++
        }
      }
    }

    return { checked: activeEmployees.length, generated: generatedCount }
  } catch (error) {
    console.error('Error checking birthdays:', error)
    throw new Error('Failed to run birthday checks')
  }
}

/**
 * checkWorkAnniversaries
 * Iterates through all active employees, checks if today is their work anniversary,
 * and generates a notification & mock email if not already created this year.
 */
export async function checkWorkAnniversaries(): Promise<{ checked: number; generated: number }> {
  try {
    const employees = await getEmployees()
    const activeEmployees = employees.filter((e) => e.status === 'active')
    const todayMMDD = getTodayMonthDay()
    const currentYear = new Date().getFullYear()
    let generatedCount = 0

    for (const emp of activeEmployees) {
      const joiningDate = emp.joiningDate
      if (!joiningDate || typeof joiningDate !== 'string' || joiningDate.length < 10) continue

      const joiningMMDD = joiningDate.slice(5, 10) // Extracts MM-DD
      const joiningYear = new Date(joiningDate).getFullYear()

      if (joiningMMDD === todayMMDD && joiningYear < currentYear) {
        const yearsCompleted = currentYear - joiningYear
        const alreadyNotified = await hasNotificationForThisYear(emp.id, 'anniversary')

        if (!alreadyNotified) {
          // 1. Create Firestore notification
          await createNotification({
            userId: emp.id,
            title: 'Happy Work Anniversary! 🌟',
            message: `Congratulations on completing ${yearsCompleted} ${
              yearsCompleted === 1 ? 'year' : 'years'
            } with the company, ${emp.name}! Thank you for your dedication.`,
            type: 'anniversary',
            createdBy: 'system',
          })

          // 2. Send mock email
          if (emp.email) {
            await sendEmail(
              emailTemplates.workAnniversaryGreeting(emp.email, emp.name, yearsCompleted)
            )
          }

          generatedCount++
        }
      }
    }

    return { checked: activeEmployees.length, generated: generatedCount }
  } catch (error) {
    console.error('Error checking work anniversaries:', error)
    throw new Error('Failed to run work anniversary checks')
  }
}
