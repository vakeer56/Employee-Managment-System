import { useAuth } from '../../hooks/useAuth';
import CheckInCard from '../../components/attendance/CheckInCard';
import SummaryCards from '../../components/attendance/SummaryCards';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import { useState } from 'react';


export default function AttendancePage() {

  const { firebaseUser, profile } = useAuth();
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

      {/* Check-in Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CheckInCard
            employeeId={profile.uid}
            employeeName={profile.displayName || 'Employee'}
            onCheckInSuccess={handleCheckInSuccess}
            onCheckOutSuccess={handleCheckOutSuccess}
          />
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-2">
          <SummaryCards employeeId={profile.uid} />
        </div>
      </div>

      {/* Attendance Table */}
      <AttendanceTable key={refreshKey} employeeId={profile.uid} title="Your Attendance History" />
    </div>
  );
}
