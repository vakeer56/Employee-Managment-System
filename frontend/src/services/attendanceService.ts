import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface AttendanceRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  workingHours: number;
  lateMark: boolean;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// Helper function to format time for display
const formatTime = (date: Date | Timestamp): string => {
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Helper to get today's date string (YYYY-MM-DD)
const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper to calculate working hours
const calculateWorkingHours = (checkInTime: string, checkOutTime: string): number => {
  try {
    const [inHour, inMin, inSec] = checkInTime.split(':').map(Number);
    const [outHour, outMin, outSec] = checkOutTime.split(':').map(Number);

    const inTotalSeconds = inHour * 3600 + inMin * 60 + inSec;
    const outTotalSeconds = outHour * 3600 + outMin * 60 + outSec;

    const diffSeconds = outTotalSeconds - inTotalSeconds;
    return Math.round((diffSeconds / 3600) * 100) / 100; // Round to 2 decimal places
  } catch {
    return 0;
  }
};

// Helper to check if time is late (after 9:30 AM)
const isLateCheckIn = (checkInTime: string): boolean => {
  const [hour, min] = checkInTime.split(':').map(Number);
  return hour > 9 || (hour === 9 && min > 30);
};

/**
 * Check-in employee for today
 * @param employeeId - Employee ID
 * @param employeeName - Employee Name
 * @returns Created/updated attendance record
 */
export const checkIn = async (employeeId: string, employeeName: string) => {
  try {
    const today = getTodayDateString();
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Check if already checked in today
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', employeeId),
      where('date', '==', today)
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      throw new Error('Already checked in today');
    }

    const isLate = isLateCheckIn(checkInTime);
    const status = isLate ? 'Late' : 'Present';

    // Create new attendance record
    const docRef = await addDoc(collection(db, 'attendance'), {
      employeeId,
      employeeName,
      date: today,
      checkIn: checkInTime,
      checkOut: null,
      status,
      workingHours: 0,
      lateMark: isLate,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      employeeId,
      employeeName,
      date: today,
      checkIn: checkInTime,
      checkOut: null,
      status,
      workingHours: 0,
      lateMark: isLate,
    };
  } catch (error) {
    throw new Error(`Check-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check-out employee for today
 * @param employeeId - Employee ID
 * @returns Updated attendance record with working hours
 */
export const checkOut = async (employeeId: string) => {
  try {
    const today = getTodayDateString();
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Find today's attendance record
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', employeeId),
      where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('No check-in record found for today');
    }

    const attendanceDoc = querySnapshot.docs[0];
    const attendanceData = attendanceDoc.data();

    if (!attendanceData.checkIn) {
      throw new Error('Employee has not checked in');
    }

    if (attendanceData.checkOut) {
      throw new Error('Already checked out today');
    }

    // Calculate working hours
    const workingHours = calculateWorkingHours(attendanceData.checkIn, checkOutTime);

    // Update document
    await updateDoc(doc(db, 'attendance', attendanceDoc.id), {
      checkOut: checkOutTime,
      workingHours,
      updatedAt: serverTimestamp(),
    });

    return {
      id: attendanceDoc.id,
      ...attendanceData,
      checkOut: checkOutTime,
      workingHours,
    };
  } catch (error) {
    throw new Error(`Check-out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get today's attendance record for an employee
 * @param employeeId - Employee ID
 * @returns Attendance record or null
 */
export const getTodayAttendance = async (employeeId: string) => {
  try {
    const today = getTodayDateString();
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', employeeId),
      where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as AttendanceRecord & { id: string };
  } catch (error) {
    throw new Error(
      `Failed to get today's attendance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};


export const getEmployeeAttendance = async (
  employeeId: string,
  pageSize: number = 10,
  startAfterId?: string
) => {
  try {

    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', employeeId)
    );
    const querySnapshot = await getDocs(q);

    // Sort descending by date in JS
    const allRecords = querySnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord & { id: string }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Client-side pagination
    if (startAfterId) {
      const startIndex = allRecords.findIndex((r) => r.id === startAfterId) + 1;
      return allRecords.slice(startIndex, startIndex + pageSize);
    }

    return allRecords.slice(0, pageSize);
  } catch (error) {
    throw new Error(
      `Failed to get employee attendance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get monthly summary for an employee
 * @param employeeId - Employee ID
 * @param year - Year (default: current)
 * @param month - Month 1-12 (default: current)
 * @returns Summary object with counts
 */
export const getMonthlySummary = async (employeeId: string, year?: number, month?: number) => {
  try {
    const now = new Date();
    const summaryYear = year || now.getFullYear();
    const summaryMonth = (month || now.getMonth() + 1).toString().padStart(2, '0');
    const datePrefix = `${summaryYear}-${summaryMonth}`;

    // Single where clause on employeeId only — avoids composite index.
    // Date range filtering is done client-side.
    const q = query(
      collection(db, 'attendance'),
      where('employeeId', '==', employeeId)
    );
    const querySnapshot = await getDocs(q);

    // Filter to the target month in JavaScript
    const records = querySnapshot.docs
      .map((d) => d.data())
      .filter((r) => typeof r.date === 'string' && r.date.startsWith(datePrefix));

    const presentDays = records.filter((r) => r.status === 'Present').length;
    const lateDays = records.filter((r) => r.lateMark === true).length;
    const absentDays = records.filter((r) => r.status === 'Absent').length;
    const totalWorkingHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);

    return {
      presentDays,
      lateDays,
      absentDays,
      totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
      totalRecords: records.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to get monthly summary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get all attendance records (Admin only)
 * @param filters - Filter criteria (employeeId, date, status, department)
 * @param pageSize - Records per page
 * @returns Array of attendance records
 */
export const getAllAttendance = async (
  filters?: {
    employeeId?: string;
    date?: string;
    status?: string;
  },
  pageSize: number = 20
) => {
  try {
    // Use a single where clause (or no clause) to avoid composite indexes.
    // Additional filters are applied client-side.
    let q;
    if (filters?.employeeId) {
      q = query(collection(db, 'attendance'), where('employeeId', '==', filters.employeeId));
    } else if (filters?.date) {
      q = query(collection(db, 'attendance'), where('date', '==', filters.date));
    } else if (filters?.status) {
      q = query(collection(db, 'attendance'), where('status', '==', filters.status));
    } else {
      q = query(collection(db, 'attendance'));
    }

    const querySnapshot = await getDocs(q);
    let records = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord & { id: string }));

    // Apply remaining filters client-side
    if (filters?.employeeId && (filters?.date || filters?.status)) {
      if (filters.date) records = records.filter((r) => r.date === filters.date);
      if (filters.status) records = records.filter((r) => r.status === filters.status as AttendanceRecord['status']);
    }

    // Sort by date descending and apply page limit
    return records
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, pageSize);
  } catch (error) {
    throw new Error(
      `Failed to get all attendance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get attendance statistics for admin dashboard
 * @returns Stats object
 */
export const getAttendanceStats = async () => {
  try {
    const today = getTodayDateString();

    // Get today's attendance
    const q = query(collection(db, 'attendance'), where('date', '==', today));
    const querySnapshot = await getDocs(q);
    const todayRecords = querySnapshot.docs.map((d) => d.data());

    const presentToday = todayRecords.filter((r) => r.status === 'Present').length;
    const absentToday = todayRecords.filter((r) => r.status === 'Absent').length;
    const lateToday = todayRecords.filter((r) => r.lateMark === true).length;

    return {
      presentToday,
      absentToday,
      lateToday,
      totalRecordsToday: todayRecords.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to get attendance stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Search attendance records
 * @param searchTerm - Search by employee name or ID
 * @param pageSize - Records per page
 * @returns Array of matching records
 */
export const searchAttendance = async (searchTerm: string, pageSize: number = 20) => {
  try {
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'), limit(pageSize));
    const querySnapshot = await getDocs(q);

    const allRecords = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Filter on client side (Firestore doesn't support case-insensitive search)
    return allRecords.filter(
      (record) =>
        record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    throw new Error(
      `Failed to search attendance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
