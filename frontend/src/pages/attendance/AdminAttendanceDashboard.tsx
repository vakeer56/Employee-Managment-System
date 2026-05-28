import { useState, useEffect } from 'react';
import { getAttendanceStats } from '../../services/attendanceService';
import AdminAttendanceTable from '../../components/attendance/AdminAttendanceTable';

interface AttendanceStats {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  totalRecordsToday: number;
}


export default function AdminAttendanceDashboard() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAttendanceStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Admin Dashboard - View and manage employee attendance</p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Present Today */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Present Today</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{stats.presentToday}</p>
              </div>
              <div className="text-green-600 text-4xl opacity-20">✓</div>
            </div>
          </div>

          {/* Late Today */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-6 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Late Today</p>
                <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.lateToday}</p>
              </div>
              <div className="text-yellow-600 text-4xl opacity-20">⏰</div>
            </div>
          </div>

          {/* Absent Today */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Absent Today</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{stats.absentToday}</p>
              </div>
              <div className="text-red-600 text-4xl opacity-20">✗</div>
            </div>
          </div>

          {/* Total Records */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Records</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{stats.totalRecordsToday}</p>
              </div>
              <div className="text-blue-600 text-4xl opacity-20">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Attendance Records Table */}
      <AdminAttendanceTable />
    </div>
  );
}
