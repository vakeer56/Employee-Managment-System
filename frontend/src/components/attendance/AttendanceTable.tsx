import { useState, useEffect } from 'react';
import type { AttendanceRecord } from '../../services/attendanceService';
import { getEmployeeAttendance } from '../../services/attendanceService';

interface AttendanceTableProps {
  employeeId: string;
  title?: string;
}

const ITEMS_PER_PAGE = 10;

/**
 * AttendanceTable Component
 * Displays attendance records in a paginated table
 * Shows check-in, check-out, status, and working hours
 */
export default function AttendanceTable({ employeeId, title = 'Attendance History' }: AttendanceTableProps) {
  const [records, setRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadAttendance(0);
  }, [employeeId]);

  const loadAttendance = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getEmployeeAttendance(employeeId, ITEMS_PER_PAGE);
      setRecords(data);
      setHasMore(data.length > ITEMS_PER_PAGE);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance records');
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

  if (loading && records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      </div>

      {error && (
        <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {records.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <p className="text-lg">No attendance records found</p>
          <p className="text-sm mt-2">Your attendance history will appear here</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check In</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check Out</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Working Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.slice(0, ITEMS_PER_PAGE).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.checkIn || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.checkOut || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {record.checkOut ? `${record.workingHours}h` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {records.slice(0, ITEMS_PER_PAGE).map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-gray-900">{record.date}</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Check In</p>
                    <p className="font-semibold">{record.checkIn || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Check Out</p>
                    <p className="font-semibold">{record.checkOut || '-'}</p>
                  </div>
                </div>
                {record.checkOut && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">Working Hours</p>
                    <p className="font-semibold text-blue-600">{record.workingHours}h</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => loadAttendance(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage + 1}
            </span>

            <button
              onClick={() => loadAttendance(currentPage + 1)}
              disabled={!hasMore || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
