import { useState } from 'react';
import type { AttendanceRecord } from '../../services/attendanceService';
import { getAllAttendance } from '../../services/attendanceService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

/**
 * AdminAttendanceTable Component
 * Displays all attendance records with filtering and search capabilities
 * Admin/HR only view
 */
export default function AdminAttendanceTable() {
  const [records, setRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {
        employeeId: filterEmployeeId || undefined,
        date: filterDate || undefined,
        status: filterStatus || undefined,
      };

      const data = await getAllAttendance(filters, 100);

      // Filter by search term (employee name)
      let filtered = data;
      if (searchTerm) {
        filtered = data.filter(
          (record) =>
            record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setRecords(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadRecords();
  };

  const handleReset = () => {
    setFilterEmployeeId('');
    setFilterDate('');
    setFilterStatus('');
    setSearchTerm('');
    setRecords([]);
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Employee Attendance Records</h2>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <Input
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Employee ID"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
            />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>

            <div className="flex gap-2">
              <Button
                onClick={handleFilter}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Fidning...' : 'Search'}
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && records.length === 0 && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p className="text-lg">No attendance records found</p>
          <p className="text-sm mt-2">Apply filters and click "Filter" to view records</p>
        </div>
      )}

      {/* Desktop Table */}
      {records.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check In</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Check Out</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.checkIn || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.checkOut || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {record.status}
                        {record.lateMark && ' 🔔'}
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
            {records.map((record) => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{record.employeeName}</p>
                    <p className="text-sm text-gray-600">ID: {record.employeeId}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="border-t pt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-semibold">{record.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check In</span>
                    <span className="font-semibold">{record.checkIn || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check Out</span>
                    <span className="font-semibold">{record.checkOut || '-'}</span>
                  </div>
                  {record.checkOut && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Working Hours</span>
                      <span className="font-semibold text-blue-600">{record.workingHours}h</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Results Info */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Showing {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
