import { useEffect, useState } from 'react'
import type { Holiday } from '../../types/leave'
import { getHolidays } from '../../services/leaveService'

export function HolidayCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHolidays() {
      try {
        const data = await getHolidays()
        setHolidays(data)
      } catch (error) {
        console.error("Failed to fetch holidays", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHolidays()
  }, [])

  if (loading) return <div className="text-gray-500 text-sm">Loading calendar...</div>

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4">Holiday Calendar</h2>
      <div className="space-y-3">
        {holidays.map(holiday => {
          const dateObj = new Date(holiday.date)
          const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          
          return (
            <div key={holiday.id} className="flex justify-between items-center p-3 bg-blue-50 text-blue-900 rounded-md">
              <span className="font-medium">{holiday.name}</span>
              <div className="text-right text-sm">
                <div className="font-semibold">{formattedDate}</div>
                <div className="text-blue-700">{day}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
