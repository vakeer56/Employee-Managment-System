import { useState, useEffect } from 'react';
import { getMonthlySummary } from '../../services/attendanceService';

interface SummaryCardsProps {
  employeeId: string;
  year?: number;
  month?: number;
}

interface SummaryData {
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalWorkingHours: number;
  totalRecords: number;
}

/**
 * SummaryCards Component
 * Displays monthly attendance summary with key metrics
 */
export default function SummaryCards({ employeeId, year, month }: SummaryCardsProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [employeeId, year, month]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMonthlySummary(employeeId, year, month);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = () => {
    const now = new Date();
    const summaryMonth = month || now.getMonth() + 1;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const summaryYear = year || now.getFullYear();
    return `${monthNames[summaryMonth - 1]} ${summaryYear}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Summary - {getMonthName()}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Present Days Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Present Days</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{summary.presentDays}</p>
            </div>
            <div className="text-green-600 text-4xl opacity-20">
              ✓
            </div>
          </div>
        </div>

        {/* Late Days Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Late Marks</p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">{summary.lateDays}</p>
            </div>
            <div className="text-yellow-600 text-4xl opacity-20">
              ⏰
            </div>
          </div>
        </div>

        {/* Absent Days Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-md p-6 border-l-4 border-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Absent Days</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{summary.absentDays}</p>
            </div>
            <div className="text-red-600 text-4xl opacity-20">
              ✗
            </div>
          </div>
        </div>

        {/* Total Hours Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Hours</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{summary.totalWorkingHours}h</p>
            </div>
            <div className="text-blue-600 text-4xl opacity-20">
              ⏱
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
