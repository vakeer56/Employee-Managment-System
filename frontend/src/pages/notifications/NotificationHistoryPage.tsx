import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/notifications/useNotifications'
import type { NotificationType } from '../../types/notification'
import { Button } from '../../components/ui/Button'

export function NotificationHistoryPage() {
  const { profile, employeeRecord } = useAuth()
  const userId = employeeRecord?.id ?? profile?.uid
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(userId)

  const [searchTerm, setSearchTerm] = useState('')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const notificationTypes: { value: string; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'leave', label: 'Leaves' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'birthday', label: 'Birthdays' },
    { value: 'anniversary', label: 'Anniversaries' },
    { value: 'announcement', label: 'Announcements' },
    { value: 'system', label: 'System' },
  ]

  // Filter notifications based on search term, read status, and type
  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRead =
      readFilter === 'all' ||
      (readFilter === 'unread' && !n.isRead) ||
      (readFilter === 'read' && n.isRead)

    const matchesType = typeFilter === 'all' || n.type === typeFilter

    return matchesSearch && matchesRead && matchesType
  })

  // Get matching badge colors and text
  const getTypeBadge = (type: NotificationType) => {
    const styles: Record<NotificationType, { bg: string; text: string; label: string }> = {
      leave: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Leave' },
      payroll: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Payroll' },
      birthday: { bg: 'bg-pink-50 border-pink-200', text: 'text-pink-700', label: 'Birthday' },
      anniversary: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Anniversary' },
      announcement: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Announcement' },
      system: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'System' },
    }
    const current = styles[type] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', label: 'Alert' }
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${current.bg} ${current.text}`}>
        {current.label}
      </span>
    )
  }

  // Type specific SVG Icons
  const getIcon = (type: NotificationType) => {
    const classes = "h-5 w-5"
    switch (type) {
      case 'leave':
        return (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        )
      case 'payroll':
        return (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-100">
            <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )
      case 'birthday':
        return (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
            <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )
      case 'anniversary':
        return (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </span>
        )
      case 'announcement':
        return (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </span>
        )
      default:
        return (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="mt-1 text-sm text-gray-500">
            View leaves, announcements, payroll updates, and system alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>Mark All as Read</Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Filter By</h2>
            
            {/* Search Input */}
            <div className="space-y-1">
              <label htmlFor="search" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-3 pr-8 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Read/Unread Filter */}
            <div className="space-y-1">
              <label htmlFor="statusFilter" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
              <select
                id="statusFilter"
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label htmlFor="typeFilter" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {notificationTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Statistics Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Summary</h2>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg bg-gray-50 p-3 text-center border border-gray-100">
                <span className="text-xs text-gray-500 font-medium block">Total</span>
                <span className="text-lg font-bold text-gray-900 mt-1 block">{notifications.length}</span>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3 text-center border border-indigo-100">
                <span className="text-xs text-indigo-700 font-medium block">Unread</span>
                <span className="text-lg font-bold text-indigo-700 mt-1 block">{unreadCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center py-12 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm text-gray-500 animate-pulse">Loading notifications...</span>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">No notifications found</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed">
                We couldn't find any notifications matching your filters or search criteria.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex gap-4 p-5 hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  {getIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </h3>
                        {getTypeBadge(notif.type)}
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                    
                    {/* Action Panel */}
                    <div className="flex items-center gap-4 mt-3">
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete notification
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default NotificationHistoryPage
