import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { getOrgSettings } from '../../services/orgSettingsService'
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../services/notifications/announcementService'
import type { Announcement } from '../../services/notifications/announcementService'

export function AnnouncementAdminPage() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all') // 'all' | 'managers' | 'hr_admins' | department

  async function loadData() {
    try {
      setLoading(true)
      const [list, org] = await Promise.all([getAnnouncements(), getOrgSettings()])
      setAnnouncements(list)
      setDepartments(org.departments || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreateModal() {
    setEditingId(null)
    setTitle('')
    setMessage('')
    setAudience('all')
    setError('')
    setSuccess('')
    setIsModalOpen(true)
  }

  function openEditModal(ann: Announcement) {
    setEditingId(ann.id)
    setTitle(ann.title)
    setMessage(ann.message)
    setAudience(ann.audience)
    setError('')
    setSuccess('')
    setIsModalOpen(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const author = profile?.displayName || profile?.email || 'Admin'

    try {
      if (editingId) {
        // Edit existing announcement
        await updateAnnouncement(editingId, {
          title: title.trim(),
          message: message.trim(),
          audience,
        })
        setSuccess('Announcement updated successfully.')
      } else {
        // Create new announcement
        await createAnnouncement(
          {
            title: title.trim(),
            message: message.trim(),
            audience,
            createdBy: author,
          },
          author
        )
        setSuccess('Announcement published and notifications sent successfully.')
      }
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ann: Announcement) {
    const confirmed = window.confirm(`Delete announcement: "${ann.title}"? This cannot be undone.`)
    if (!confirmed) return

    setError('')
    setSuccess('')
    try {
      await deleteAnnouncement(ann.id)
      setSuccess('Announcement deleted successfully.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement.')
    }
  }

  const getAudienceLabel = (aud: string) => {
    if (aud === 'all') return 'All Employees'
    if (aud === 'managers') return 'Managers'
    if (aud === 'hr_admins') return 'HR Admins'
    return `Department: ${aud}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
          <p className="mt-1 text-sm text-gray-600">
            Publish corporate announcements, notices, and target specific departments or roles
          </p>
        </div>
        <Button onClick={openCreateModal}>Create Announcement</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Announcements Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">No announcements published</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Click "Create Announcement" to publish your first notice and notify employees.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-250 bg-gray-50 text-gray-700">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Message Preview</th>
                <th className="px-5 py-3 font-semibold">Target Audience</th>
                <th className="px-5 py-3 font-semibold">Published By</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {announcements.map((ann) => (
                <tr key={ann.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{ann.title}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{ann.message}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                      {getAudienceLabel(ann.audience)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{ann.createdBy}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {new Date(ann.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => openEditModal(ann)}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => handleDelete(ann)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Overlay & Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Announcement Title"
                placeholder="e.g. Annual General Meeting / Holiday Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message Body
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Enter the full text of the announcement..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="audience" className="block text-sm font-medium text-gray-700">
                  Target Audience
                </label>
                <select
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Employees</option>
                  <option value="managers">Managers Only</option>
                  <option value="hr_admins">HR Admins Only</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      Department: {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingId ? 'Save Changes' : 'Publish Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default AnnouncementAdminPage
