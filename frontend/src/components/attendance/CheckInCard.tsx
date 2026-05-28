import { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord } from '../../services/attendanceService';
import { checkIn, checkOut, getTodayAttendance } from '../../services/attendanceService';
import { Button } from '../ui/Button';

interface CheckInCardProps {
  employeeId: string;
  employeeName: string;
  onCheckInSuccess?: () => void;
  onCheckOutSuccess?: () => void;
}

/**
 * CheckInCard Component
 * Displays check-in/check-out functionality for employees
 * Shows current status and timestamps
 */
export default function CheckInCard({
  employeeId,
  employeeName,
  onCheckInSuccess,
  onCheckOutSuccess,
}: CheckInCardProps) {
  const [attendance, setAttendance] = useState<(AttendanceRecord & { id: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Track which calendar date the card is showing so we can detect day roll-over.
  const [todayString, setTodayString] = useState<string>(getLocalDateString);

  /** Returns YYYY-MM-DD in LOCAL time (not UTC) */
  function getLocalDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ── Midnight reset ─────────────────────────────────────────────────────────
  // Schedule a timer that fires exactly at the next local midnight.
  // When it fires: update todayString → the data-fetch useEffect re-runs
  // → attendance is re-fetched for the new day → buttons reset.
  useEffect(() => {
    function msUntilMidnight() {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow
        0, 0, 0, 0,
      );
      return midnight.getTime() - now.getTime();
    }

    const timer = setTimeout(() => {
      // Day has changed: clear stale state and update the tracked date.
      setAttendance(null);
      setError(null);
      setSuccess(null);
      setTodayString(getLocalDateString());
    }, msUntilMidnight());

    return () => clearTimeout(timer);
  }, [todayString]); // re-schedule each time the date string changes

  const loadTodayAttendance = useCallback(async () => {
    try {
      const record = await getTodayAttendance(employeeId);
      setAttendance(record as AttendanceRecord & { id: string });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    }
  }, [employeeId]);

  // Re-fetch whenever the employee changes OR the tracked date changes
  // (the date changes at midnight via the timer above).
  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance, todayString]);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await checkIn(employeeId, employeeName);
      setAttendance(result as any);
      setSuccess('✓ Checked in successfully!');
      onCheckInSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Check-in failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await checkOut(employeeId);
      setAttendance(result as any);
      setSuccess('✓ Checked out successfully!');
      onCheckOutSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Check-out failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Check-In/Out</h2>

      {/* Status Badge */}
      {attendance && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-gray-600">Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
              attendance.status
            )}`}
          >
            {attendance.status}
          </span>
        </div>
      )}

      {/* Check-in Time */}
      {attendance?.checkIn && (
        <div className="mb-3 pb-3 border-b">
          <p className="text-sm text-gray-600">Check-in Time</p>
          <p className="text-lg font-semibold text-gray-800">{attendance.checkIn}</p>
        </div>
      )}

      {/* Check-out Time */}
      {attendance?.checkOut && (
        <div className="mb-3 pb-3 border-b">
          <p className="text-sm text-gray-600">Check-out Time</p>
          <p className="text-lg font-semibold text-gray-800">{attendance.checkOut}</p>
        </div>
      )}

      {/* Working Hours */}
      {attendance?.checkOut && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm text-gray-600">Working Hours</p>
          <p className="text-lg font-semibold text-blue-600">{attendance.workingHours} hrs</p>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCheckIn}
          disabled={!!attendance?.checkIn || loading}
          className={`flex-1 ${
            attendance?.checkIn
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Processing...' : attendance?.checkIn ? 'Checked In' : 'Check In'}
        </Button>

        <Button
          onClick={handleCheckOut}
          disabled={!attendance?.checkIn || !!attendance?.checkOut || loading}
          className={`flex-1 ${
            !attendance?.checkIn || attendance?.checkOut
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : attendance?.checkOut ? 'Checked Out' : 'Check Out'}
        </Button>
      </div>

      {/* No Attendance Yet */}
      {!attendance && (
        <p className="text-center text-gray-600 text-sm">
          You haven't checked in today. Click "Check In" to start.
        </p>
      )}
    </div>
  );
}
