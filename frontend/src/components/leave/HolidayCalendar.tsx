import { useEffect, useState } from 'react'
import type { Holiday } from '../../types/leave'
import { getHolidays, addHoliday, removeHoliday } from '../../services/leaveService'
import { useAuth } from '../../hooks/useAuth'
import { hasRole } from '../../utils/roles'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

function sortHolidaysByDate(holidays: Holiday[]): Holiday[] {
  return [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function HolidayCalendar() {
  const { profile } = useAuth()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  
  // Add holiday state
  const [newHolidayName, setNewHolidayName] = useState('')
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isHrAdmin = hasRole(profile?.role, ['super_admin', 'hr_admin'])

  const parseHolidayDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  async function fetchHolidays() {
    setLoading(true)
    try {
      const data = await getHolidays()
      setHolidays(sortHolidaysByDate(data))
    } catch (error) {
      console.error("Failed to fetch holidays", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    getHolidays()
      .then((data) => {
        if (!cancelled) {
          setHolidays(sortHolidaysByDate(data))
        }
      })
      .catch((error) => {
        console.error("Failed to fetch holidays", error)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHolidayName || !newHolidayDate) return
    setIsSubmitting(true)
    try {
      await addHoliday({ name: newHolidayName, date: newHolidayDate })
      setNewHolidayName('')
      setNewHolidayDate('')
      await fetchHolidays()
    } catch (error) {
      console.error("Failed to add holiday", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveHoliday = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this holiday?")) return
    try {
      await removeHoliday(id)
      await fetchHolidays()
    } catch (error) {
      console.error("Failed to remove holiday", error)
    }
  }

  if (loading && holidays.length === 0) return <div className="text-gray-500 text-sm">Loading calendar...</div>

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-4">Holiday Calendar</h2>
      
      {isHrAdmin && (
        <form onSubmit={handleAddHoliday} className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Holiday</h3>
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Holiday Name"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="e.g. New Year"
                required
              />
            </div>
            <div className="flex-1 w-full">
              <Input
                label="Date"
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full md:w-auto">Add</Button>
          </div>
        </form>
      )}

      {holidays.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-4">No holidays defined.</div>
      ) : (
        <div className="space-y-3">
          {holidays.map(holiday => {
            const dateObj = parseHolidayDate(holiday.date)
            const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            
            return (
              <div key={holiday.id} className="flex justify-between items-center p-3 bg-blue-50 text-blue-900 rounded-md">
                <span className="font-medium">{holiday.name}</span>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <div className="font-semibold">{formattedDate}</div>
                    <div className="text-blue-700">{day}</div>
                  </div>
                  {isHrAdmin && (
                    <button 
                      onClick={() => handleRemoveHoliday(holiday.id!)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Remove holiday"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
