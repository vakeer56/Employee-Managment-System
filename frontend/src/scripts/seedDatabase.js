/**
 * seedDatabase.js
 *
 * Firestore seeding script for the Employee Management System.
 *
 * This script populates Firestore with realistic Indian HRMS dummy data:
 *   - departments
 *   - employees (with proper hierarchy: CEO → Managers → Employees)
 *   - attendance records (last 30 days)
 *   - leave requests
 *
 * Exported function: runSeed(db)
 *   - Call this from the SeedDataPage admin UI.
 *   - Pass the Firestore `db` instance (from firebase.ts).
 *
 * Usage from SeedDataPage:
 *   import { runSeed } from '../../scripts/seedDatabase'
 *   import { db } from '../../services/firebase'
 *   await runSeed(db)
 */

import {
  collection,
  addDoc,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'

// ─────────────────────────────────────────────
// 1. STATIC DATA POOLS
// ─────────────────────────────────────────────

/** Indian first names (male + female mix) */
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
  'Sai', 'Reyansh', 'Ayaan', 'Atharv', 'Dhruv',
  'Priya', 'Sneha', 'Ananya', 'Divya', 'Pooja',
  'Kavya', 'Riya', 'Meera', 'Nisha', 'Swati',
  'Rohan', 'Karan', 'Rahul', 'Nikhil', 'Amit',
  'Suresh', 'Rajesh', 'Deepak', 'Mohit', 'Vikram',
]

/** Indian last names */
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Mehta', 'Gupta',
  'Joshi', 'Singh', 'Kumar', 'Mishra', 'Nair',
  'Pillai', 'Rao', 'Reddy', 'Shah', 'Kapoor',
  'Malhotra', 'Bose', 'Chatterjee', 'Banerjee', 'Das',
]

/** Office cities */
const WORK_LOCATIONS = [
  'Bangalore', 'Mumbai', 'Hyderabad', 'Pune',
  'Chennai', 'Delhi', 'Noida', 'Gurgaon',
]

/** Leave reasons pool */
const LEAVE_REASONS = [
  'Personal work',
  'Not feeling well, running fever',
  'Family function attendance',
  'Medical appointment',
  'Out-of-station travel',
  'Child school event',
  'Home repair emergency',
  'Visiting hometown',
]

/** Leave types matching the app's LeaveType enum */
const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'WFH']

/** Leave statuses matching the app's LeaveStatus enum */
const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

/** Attendance statuses */
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'Leave']

// ─────────────────────────────────────────────
// 2. HELPER FUNCTIONS
// ─────────────────────────────────────────────

/** Pick a random element from an array */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Return a random integer between min and max (inclusive) */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Format a Date object as "YYYY-MM-DD" */
function toDateString(date) {
  return date.toISOString().split('T')[0]
}

/** Generate a time string like "09:15:00" given hour+minute */
function toTimeString(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}

/**
 * Calculate working hours between two "HH:MM:SS" strings.
 * Returns a number rounded to 2 decimal places.
 */
function calcWorkingHours(checkIn, checkOut) {
  const [ih, im] = checkIn.split(':').map(Number)
  const [oh, om] = checkOut.split(':').map(Number)
  const inMins = ih * 60 + im
  const outMins = oh * 60 + om
  return Math.round(((outMins - inMins) / 60) * 100) / 100
}

/**
 * Generate a realistic employee ID like "EMP-0023"
 * @param {number} index - 1-based index
 */
function generateEmployeeId(index) {
  return `EMP-${String(index).padStart(4, '0')}`
}

/**
 * Generate an email address from a full name and department shortcode.
 * Example: "Arjun Sharma" + "eng" → "arjun.sharma.eng@hrms.in"
 */
function generateEmail(name, deptShort) {
  const safe = name.toLowerCase().replace(/\s+/g, '.')
  return `${safe}.${deptShort}@hrms.in`
}

/** Generate a random Indian mobile number */
function generatePhone() {
  const prefixes = ['98', '97', '96', '95', '94', '93', '70', '80', '81', '82']
  return pickRandom(prefixes) + String(randomInt(10000000, 99999999))
}

/**
 * Generate a random joining date between 1-4 years ago.
 * Returns "YYYY-MM-DD".
 */
function generateJoiningDate() {
  const now = new Date()
  const yearsAgo = randomInt(1, 4)
  const d = new Date(now)
  d.setFullYear(d.getFullYear() - yearsAgo)
  d.setMonth(randomInt(0, 11))
  d.setDate(randomInt(1, 28))
  return toDateString(d)
}

/** Map department name → short code used in emails */
const DEPT_SHORT = {
  Engineering: 'eng',
  'Human Resources': 'hr',
  Finance: 'fin',
  Marketing: 'mkt',
  Operations: 'ops',
  Sales: 'sales',
}

// ─────────────────────────────────────────────
// 3. DEPARTMENT SEED DATA
// ─────────────────────────────────────────────

const DEPARTMENTS = [
  {
    name: 'Engineering',
    description: 'Responsible for product development, software engineering, and technical infrastructure.',
  },
  {
    name: 'Human Resources',
    description: 'Manages recruitment, employee relations, payroll, and organizational development.',
  },
  {
    name: 'Finance',
    description: 'Handles budgeting, accounting, financial reporting, and compliance.',
  },
  {
    name: 'Marketing',
    description: 'Drives brand strategy, campaigns, digital marketing, and customer acquisition.',
  },
  {
    name: 'Operations',
    description: 'Oversees day-to-day operations, logistics, and process optimization.',
  },
  {
    name: 'Sales',
    description: 'Manages client relationships, revenue targets, and business development.',
  },
]

// ─────────────────────────────────────────────
// 4. EMPLOYEE HIERARCHY DEFINITION
//
//  We define employees with explicit relationships so
//  managerId references are set correctly.
//
//  Hierarchy:
//    CEO (role: super_admin)
//    ├── HR Manager        (role: hr_admin,  dept: Human Resources)
//    │     ├── HR Executive × 2
//    ├── Engineering Manager  (role: manager, dept: Engineering)
//    │     ├── Team Lead
//    │     ├── Software Engineer × 4
//    │     ├── QA Engineer × 2
//    │     └── UI/UX Designer × 1
//    ├── Finance Manager    (role: manager, dept: Finance)
//    │     ├── Finance Executive × 2
//    ├── Marketing Manager  (role: manager, dept: Marketing)
//    │     ├── Marketing Executive × 2
//    ├── Operations Manager (role: manager, dept: Operations)
//    │     ├── Operations Executive × 2
//    └── Sales Manager      (role: manager, dept: Sales)
//          └── Sales Executive × 2
//
//  Total = 1 + 1+2 + 1+1+4+2+1 + 1+2 + 1+2 + 1+2 + 1+2 = 25 employees
// ─────────────────────────────────────────────

/**
 * Build the employee definitions array.
 *
 * Each entry is an object. We assign names randomly from the pools
 * but keep the structural fields (designation, role, dept) fixed.
 *
 * Returns an array of plain objects ready to insert into Firestore.
 * managerId is referenced by the INDEX of the manager in this array,
 * and resolved to the actual Firestore doc ID after insertion.
 */
function buildEmployeeDefinitions() {
  // Track which pool positions we've used to avoid duplicate names
  const usedNames = new Set()

  function uniqueName() {
    let attempts = 0
    while (attempts < 100) {
      const first = pickRandom(FIRST_NAMES)
      const last = pickRandom(LAST_NAMES)
      const full = `${first} ${last}`
      if (!usedNames.has(full)) {
        usedNames.add(full)
        return full
      }
      attempts++
    }
    // Fallback: append a number
    const full = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)} ${randomInt(1, 99)}`
    usedNames.add(full)
    return full
  }

  // We'll build the list in hierarchical order so indices are predictable:
  //   index 0 = CEO
  //   index 1 = HR Manager
  //   index 2,3 = HR Executives
  //   index 4 = Engineering Manager
  //   index 5 = Team Lead
  //   index 6-9 = Software Engineers
  //   index 10-11 = QA Engineers
  //   index 12 = UI/UX Designer
  //   index 13 = Finance Manager
  //   index 14-15 = Finance Executives
  //   index 16 = Marketing Manager
  //   index 17-18 = Marketing Executives
  //   index 19 = Operations Manager
  //   index 20-21 = Operations Executives
  //   index 22 = Sales Manager
  //   index 23-24 = Sales Executives

  const defs = [
    // 0 — CEO
    {
      name: uniqueName(), dept: 'Engineering', designation: 'CEO',
      role: 'super_admin', managerIdx: null,
      salary: 2500000, employmentType: 'full_time',
    },
    // 1 — HR Manager (reports to CEO)
    {
      name: uniqueName(), dept: 'Human Resources', designation: 'HR Manager',
      role: 'hr_admin', managerIdx: 0,
      salary: 1200000, employmentType: 'full_time',
    },
    // 2,3 — HR Executives (report to HR Manager)
    {
      name: uniqueName(), dept: 'Human Resources', designation: 'HR Executive',
      role: 'employee', managerIdx: 1,
      salary: 700000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Human Resources', designation: 'HR Executive',
      role: 'employee', managerIdx: 1,
      salary: 680000, employmentType: 'full_time',
    },
    // 4 — Engineering Manager (reports to CEO)
    {
      name: uniqueName(), dept: 'Engineering', designation: 'Engineering Manager',
      role: 'manager', managerIdx: 0,
      salary: 1500000, employmentType: 'full_time',
    },
    // 5 — Team Lead (reports to Eng Manager)
    {
      name: uniqueName(), dept: 'Engineering', designation: 'Team Lead',
      role: 'manager', managerIdx: 4,
      salary: 1100000, employmentType: 'full_time',
    },
    // 6-9 — Software Engineers (report to Team Lead)
    {
      name: uniqueName(), dept: 'Engineering', designation: 'Software Engineer',
      role: 'employee', managerIdx: 5,
      salary: 900000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Engineering', designation: 'Software Engineer',
      role: 'employee', managerIdx: 5,
      salary: 850000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Engineering', designation: 'Software Engineer',
      role: 'employee', managerIdx: 5,
      salary: 875000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Engineering', designation: 'Software Engineer',
      role: 'employee', managerIdx: 5,
      salary: 920000, employmentType: 'full_time',
    },
    // 10-11 — QA Engineers (report to Team Lead)
    {
      name: uniqueName(), dept: 'Engineering', designation: 'QA Engineer',
      role: 'employee', managerIdx: 5,
      salary: 800000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Engineering', designation: 'QA Engineer',
      role: 'employee', managerIdx: 5,
      salary: 780000, employmentType: 'full_time',
    },
    // 12 — UI/UX Designer (reports to Team Lead)
    {
      name: uniqueName(), dept: 'Engineering', designation: 'UI/UX Designer',
      role: 'employee', managerIdx: 5,
      salary: 850000, employmentType: 'full_time',
    },
    // 13 — Finance Manager (reports to CEO)
    {
      name: uniqueName(), dept: 'Finance', designation: 'Finance Manager',
      role: 'manager', managerIdx: 0,
      salary: 1300000, employmentType: 'full_time',
    },
    // 14-15 — Finance Executives (report to Finance Manager)
    {
      name: uniqueName(), dept: 'Finance', designation: 'Finance Executive',
      role: 'employee', managerIdx: 13,
      salary: 700000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Finance', designation: 'Finance Executive',
      role: 'employee', managerIdx: 13,
      salary: 690000, employmentType: 'full_time',
    },
    // 16 — Marketing Manager (reports to CEO)
    {
      name: uniqueName(), dept: 'Marketing', designation: 'Marketing Manager',
      role: 'manager', managerIdx: 0,
      salary: 1200000, employmentType: 'full_time',
    },
    // 17-18 — Marketing Executives
    {
      name: uniqueName(), dept: 'Marketing', designation: 'Marketing Executive',
      role: 'employee', managerIdx: 16,
      salary: 650000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Marketing', designation: 'Marketing Executive',
      role: 'employee', managerIdx: 16,
      salary: 640000, employmentType: 'full_time',
    },
    // 19 — Operations Manager (reports to CEO)
    {
      name: uniqueName(), dept: 'Operations', designation: 'Operations Manager',
      role: 'manager', managerIdx: 0,
      salary: 1250000, employmentType: 'full_time',
    },
    // 20-21 — Operations Executives
    {
      name: uniqueName(), dept: 'Operations', designation: 'Operations Executive',
      role: 'employee', managerIdx: 19,
      salary: 660000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Operations', designation: 'Operations Executive',
      role: 'employee', managerIdx: 19,
      salary: 650000, employmentType: 'full_time',
    },
    // 22 — Sales Manager (reports to CEO)
    {
      name: uniqueName(), dept: 'Sales', designation: 'Sales Manager',
      role: 'manager', managerIdx: 0,
      salary: 1200000, employmentType: 'full_time',
    },
    // 23-24 — Sales Executives
    {
      name: uniqueName(), dept: 'Sales', designation: 'Sales Executive',
      role: 'employee', managerIdx: 22,
      salary: 700000, employmentType: 'full_time',
    },
    {
      name: uniqueName(), dept: 'Sales', designation: 'Sales Executive',
      role: 'employee', managerIdx: 22,
      salary: 680000, employmentType: 'full_time',
    },
  ]

  return defs
}

// ─────────────────────────────────────────────
// 5. GENERATE ATTENDANCE FOR ONE EMPLOYEE
//
//  Creates records for the last 30 calendar days.
//  Skips weekends (Saturday = 6, Sunday = 0).
//  Random logic:
//    - 75% chance: Present (normal check-in 8:45–9:15)
//    - 10% chance: Late    (check-in 9:31–10:30)
//    -  8% chance: Absent
//    -  7% chance: Leave
// ─────────────────────────────────────────────

function generateAttendanceForEmployee(employeeId, employeeName) {
  const records = []
  const today = new Date()

  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    const date = new Date(today)
    date.setDate(today.getDate() - daysAgo)

    // Skip weekends
    const dayOfWeek = date.getDay() // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    const dateStr = toDateString(date)
    const rand = Math.random()

    if (rand < 0.75) {
      // ── Present ──────────────────────────
      const checkInH = 8
      const checkInM = randomInt(45, 59)
      const checkOutH = randomInt(17, 18)
      const checkOutM = randomInt(0, 59)
      const checkIn = toTimeString(checkInH, checkInM)
      const checkOut = toTimeString(checkOutH, checkOutM)

      records.push({
        employeeId,
        employeeName,
        date: dateStr,
        checkIn,
        checkOut,
        status: 'Present',
        workingHours: calcWorkingHours(checkIn, checkOut),
        lateMark: false,
      })
    } else if (rand < 0.85) {
      // ── Late ─────────────────────────────
      const checkInH = rand < 0.80 ? 9 : 10
      const checkInM = checkInH === 9 ? randomInt(31, 59) : randomInt(0, 30)
      const checkOutH = randomInt(17, 19)
      const checkOutM = randomInt(0, 59)
      const checkIn = toTimeString(checkInH, checkInM)
      const checkOut = toTimeString(checkOutH, checkOutM)

      records.push({
        employeeId,
        employeeName,
        date: dateStr,
        checkIn,
        checkOut,
        status: 'Late',
        workingHours: calcWorkingHours(checkIn, checkOut),
        lateMark: true,
      })
    } else if (rand < 0.93) {
      // ── Absent ───────────────────────────
      records.push({
        employeeId,
        employeeName,
        date: dateStr,
        checkIn: null,
        checkOut: null,
        status: 'Absent',
        workingHours: 0,
        lateMark: false,
      })
    } else {
      // ── Leave ────────────────────────────
      records.push({
        employeeId,
        employeeName,
        date: dateStr,
        checkIn: null,
        checkOut: null,
        status: 'Leave',
        workingHours: 0,
        lateMark: false,
      })
    }
  }

  return records
}

// ─────────────────────────────────────────────
// 6. GENERATE LEAVE REQUESTS FOR ONE EMPLOYEE
// ─────────────────────────────────────────────

/**
 * Generate 1–3 leave requests for an employee.
 * Dates are randomised within the last 60 days.
 */
function generateLeavesForEmployee(employeeId, employeeName) {
  const leaves = []
  const count = randomInt(1, 3)
  const today = new Date()

  for (let i = 0; i < count; i++) {
    const startDaysAgo = randomInt(5, 60)
    const durationDays = randomInt(1, 3)

    const startDate = new Date(today)
    startDate.setDate(today.getDate() - startDaysAgo)

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + durationDays - 1)

    leaves.push({
      employeeId,
      employeeName,
      type: pickRandom(LEAVE_TYPES),
      startDate: toDateString(startDate),
      endDate: toDateString(endDate),
      reason: pickRandom(LEAVE_REASONS),
      status: pickRandom(LEAVE_STATUSES),
      appliedOn: new Date(startDate.getTime() - randomInt(1, 7) * 86400000).toISOString(),
    })
  }

  return leaves
}

// ─────────────────────────────────────────────
// 7. DUPLICATE DETECTION
// ─────────────────────────────────────────────

/**
 * Check if a collection already has seed data.
 * We use a lightweight "count > 0" check.
 * Returns true if data already exists.
 */
async function collectionHasData(db, collectionName) {
  const snap = await getDocs(query(collection(db, collectionName)))
  return !snap.empty
}

// ─────────────────────────────────────────────
// 8. MAIN SEED FUNCTION
// ─────────────────────────────────────────────

/**
 * runSeed — seeds Firestore with HRMS dummy data.
 *
 * @param {import('firebase/firestore').Firestore} db - Firestore instance
 * @param {{ force?: boolean, onProgress?: (msg: string) => void }} options
 *   force:      if true, skip duplicate check and always seed
 *   onProgress: optional callback to receive status updates
 *
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function runSeed(db, options = {}) {
  const { force = false, onProgress = () => {} } = options

  try {
    // ── Duplicate Guard ──────────────────────
    if (!force) {
      onProgress('Checking for existing data…')
      const alreadySeeded = await collectionHasData(db, 'departments')
      if (alreadySeeded) {
        return {
          success: false,
          message:
            'Data already exists in Firestore. ' +
            'To re-seed, click "Clear & Re-seed" or set force=true.',
        }
      }
    }

    // ────────────────────────────────────────
    // STEP 1: Seed Departments
    // ────────────────────────────────────────
    onProgress('Seeding departments…')

    const deptIdByName = {} // { "Engineering": "abc123", ... }

    for (const dept of DEPARTMENTS) {
      const docRef = await addDoc(collection(db, 'departments'), {
        name: dept.name,
        description: dept.description,
        createdAt: serverTimestamp(),
      })
      deptIdByName[dept.name] = docRef.id
    }

    onProgress(`✓ ${DEPARTMENTS.length} departments added.`)

    // ────────────────────────────────────────
    // STEP 2: Seed Employees (with hierarchy)
    // ────────────────────────────────────────
    onProgress('Building employee definitions…')

    const employeeDefs = buildEmployeeDefinitions()
    const insertedEmployeeIds = [] // parallel array: insertedEmployeeIds[i] = Firestore doc ID

    onProgress('Seeding employees…')

    for (let i = 0; i < employeeDefs.length; i++) {
      const def = employeeDefs[i]
      const deptShort = DEPT_SHORT[def.dept] || 'emp'

      // Resolve manager's Firestore ID (null for CEO)
      const managerId =
        def.managerIdx !== null ? insertedEmployeeIds[def.managerIdx] ?? '' : ''

      const employeeDoc = {
        employeeId: generateEmployeeId(i + 1),
        name: def.name,
        email: generateEmail(def.name, deptShort),
        phone: generatePhone(),
        department: def.dept,
        designation: def.designation,
        managerId,
        role: def.role,
        joiningDate: generateJoiningDate(),
        workLocation: pickRandom(WORK_LOCATIONS),
        employmentType: def.employmentType,
        profileImage: '', // placeholder – no real image
        salary: def.salary,
        status: 'active',
        statusHistory: [{ status: 'active', changedAt: new Date().toISOString() }],
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'employees'), employeeDoc)
      insertedEmployeeIds.push(docRef.id)
    }

    onProgress(`✓ ${employeeDefs.length} employees added with hierarchy.`)

    // ────────────────────────────────────────
    // STEP 3: Seed Attendance (batch writes)
    //
    // Firestore batch limit = 500 operations.
    // We flush every 450 to be safe.
    // ────────────────────────────────────────
    onProgress('Generating attendance records…')

    let batch = writeBatch(db)
    let batchCount = 0
    const BATCH_LIMIT = 450
    let totalAttendance = 0

    for (let i = 0; i < employeeDefs.length; i++) {
      const empId = insertedEmployeeIds[i]
      const empName = employeeDefs[i].name
      const records = generateAttendanceForEmployee(empId, empName)

      for (const record of records) {
        const ref = doc(collection(db, 'attendance'))
        batch.set(ref, { ...record, createdAt: serverTimestamp() })
        batchCount++
        totalAttendance++

        // Flush batch when we approach the limit
        if (batchCount >= BATCH_LIMIT) {
          await batch.commit()
          batch = writeBatch(db)
          batchCount = 0
          onProgress(`  …attendance batch committed (${totalAttendance} so far)`)
        }
      }
    }

    // Commit remaining records
    if (batchCount > 0) {
      await batch.commit()
    }

    onProgress(`✓ ${totalAttendance} attendance records added.`)

    // ────────────────────────────────────────
    // STEP 4: Seed Leave Requests (batch writes)
    // ────────────────────────────────────────
    onProgress('Generating leave requests…')

    let leaveBatch = writeBatch(db)
    let leaveBatchCount = 0
    let totalLeaves = 0

    for (let i = 0; i < employeeDefs.length; i++) {
      const empId = insertedEmployeeIds[i]
      const empName = employeeDefs[i].name
      const leaves = generateLeavesForEmployee(empId, empName)

      for (const leave of leaves) {
        const ref = doc(collection(db, 'leaves'))
        leaveBatch.set(ref, { ...leave, appliedAt: serverTimestamp() })
        leaveBatchCount++
        totalLeaves++

        if (leaveBatchCount >= BATCH_LIMIT) {
          await leaveBatch.commit()
          leaveBatch = writeBatch(db)
          leaveBatchCount = 0
        }
      }
    }

    if (leaveBatchCount > 0) {
      await leaveBatch.commit()
    }

    onProgress(`✓ ${totalLeaves} leave requests added.`)

    // ────────────────────────────────────────
    // Done!
    // ────────────────────────────────────────
    onProgress('🎉 Seeding complete!')

    return {
      success: true,
      message: `Database seeded successfully!\n` +
        `• ${DEPARTMENTS.length} departments\n` +
        `• ${employeeDefs.length} employees\n` +
        `• ${totalAttendance} attendance records\n` +
        `• ${totalLeaves} leave requests`,
    }
  } catch (error) {
    console.error('[Seed Error]', error)
    return {
      success: false,
      message: `Seeding failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// ─────────────────────────────────────────────
// 9. CLEAR SEED DATA
//
// Deletes all documents from the four seeded collections.
// Uses batched deletes (max 450 ops per batch).
//
// WARNING: This permanently deletes ALL documents in those
// collections — including any real data you may have added.
// Use only in development!
// ─────────────────────────────────────────────

/**
 * clearSeedData — removes all documents from seeded collections.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ onProgress?: (msg: string) => void }} options
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function clearSeedData(db, options = {}) {
  const { onProgress = () => {} } = options
  const COLLECTIONS = ['departments', 'employees', 'attendance', 'leaves']

  try {
    for (const col of COLLECTIONS) {
      onProgress(`Clearing ${col}…`)
      const snap = await getDocs(collection(db, col))

      if (snap.empty) {
        onProgress(`  (${col} is already empty)`)
        continue
      }

      // Delete in batches of 450
      let batch = writeBatch(db)
      let count = 0
      let total = 0

      for (const docSnap of snap.docs) {
        batch.delete(docSnap.ref)
        count++
        total++

        if (count >= 450) {
          await batch.commit()
          batch = writeBatch(db)
          count = 0
        }
      }

      if (count > 0) {
        await batch.commit()
      }

      onProgress(`✓ Cleared ${total} documents from ${col}.`)
    }

    return { success: true, message: 'All seed data cleared successfully.' }
  } catch (error) {
    console.error('[Clear Error]', error)
    return {
      success: false,
      message: `Clear failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
