import { useAuth } from '../../hooks/useAuth';
import CheckInCard from '../../components/attendance/CheckInCard';
import SummaryCards from '../../components/attendance/SummaryCards';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import { useState } from 'react';


export default function AttendancePage() {

  const { firebaseUser, profile, employeeRecord } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!firebaseUser || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const actualEmployeeId = employeeRecord?.id || profile.uid;

  const handleCheckInSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCheckOutSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Manage your attendance and view history</p>
      </div>

      {!employeeRecord && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No employee record matches your login email ({firebaseUser.email}). Ask HR to create an employee profile for you so your attendance is properly linked to your official record.
        </div>
      )}

      {/* Check-in Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CheckInCard
            employeeId={actualEmployeeId}
            employeeName={profile.displayName || 'Employee'}
            onCheckInSuccess={handleCheckInSuccess}
            onCheckOutSuccess={handleCheckOutSuccess}
          />
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-2">
          <SummaryCards employeeId={actualEmployeeId} />
        </div>
      </div>

      {/* Attendance Table */}
      <AttendanceTable key={refreshKey} employeeId={actualEmployeeId} title="Your Attendance History" />
    </div>
  );
}
