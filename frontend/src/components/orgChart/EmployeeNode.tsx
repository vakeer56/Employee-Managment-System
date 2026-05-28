import { useRef } from 'react'
import type { Employee } from '../../types/employee'

// Department → color mapping for visual coding
const DEPT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Engineering:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  HR:            { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
  Finance:       { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  Marketing:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Operations:    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Sales:         { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  Design:        { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200' },
  Product:       { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }

function getColor(dept: string) {
  return DEPT_COLORS[dept] ?? DEFAULT_COLOR
}

/** Generate initials avatar from name */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface EmployeeNodeProps {
  employee: Employee & { children: unknown[] }
  isMatched: boolean
  isAncestor: boolean
  isCollapsed: boolean
  hasChildren: boolean
  isDragging: boolean
  isManagement: boolean
  onToggleCollapse: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: (newManagerId: string) => void
}

/**
 * EmployeeNode — the individual card rendered for each employee.
 *
 * Features:
 * - Avatar with initials fallback
 * - Department color coding
 * - Highlighted border when search matches
 * - Expand/collapse button for nodes with children
 * - Drag handle (admin/HR only) for manager reassignment
 * - Drop zone: any card can receive a drag to reassign a manager
 */
export function EmployeeNode({
  employee,
  isMatched,
  isAncestor,
  isCollapsed,
  hasChildren,
  isDragging,
  isManagement,
  onToggleCollapse,
  onDragStart,
  onDragEnd,
  onDrop,
}: EmployeeNodeProps) {
  const colors = getColor(employee.department)
  const dragOverRef = useRef(false)

  const cardBase =
    'relative inline-flex flex-col items-center bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 w-44 cursor-default select-none'

  const matchBorder = isMatched
    ? 'border-indigo-500 shadow-indigo-200 shadow-md ring-2 ring-indigo-300'
    : isAncestor
    ? 'border-indigo-200'
    : `${colors.border}`

  const draggingStyle = isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:-translate-y-0.5'

  // ── Drag & Drop handlers (native HTML5 DnD — no extra lib needed) ──────────
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('employeeId', employee.id)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart()
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverRef.current = true
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('employeeId')
    if (draggedId && draggedId !== employee.id) {
      onDrop(employee.id) // this employee becomes the new manager
    }
    dragOverRef.current = false
  }

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        draggable={isManagement}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${cardBase} ${matchBorder} ${draggingStyle} p-3 gap-2`}
      >
        {/* Drag handle indicator (management only) */}
        {isManagement && (
          <div className="absolute top-2 right-2 text-gray-300 cursor-grab active:cursor-grabbing text-xs">
            ⠿
          </div>
        )}

        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold ${colors.bg} ${colors.text} border-2 ${colors.border} shrink-0`}
        >
          {getInitials(employee.name)}
        </div>

        {/* Name */}
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
            {employee.name}
          </p>
        </div>

        {/* Designation badge */}
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} truncate max-w-full`}
        >
          {employee.designation || '—'}
        </span>

        {/* Department */}
        <p className="text-[10px] text-gray-400 truncate max-w-full">{employee.department}</p>

        {/* Reportee count */}
        {hasChildren && (
          <p className="text-[10px] text-gray-400">
            {(employee as Employee & { children: unknown[] }).children.length} direct report
            {(employee as Employee & { children: unknown[] }).children.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Highlighted indicator */}
        {isMatched && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Expand / Collapse button */}
      {hasChildren && (
        <button
          onClick={onToggleCollapse}
          className="mt-2 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition shadow-sm text-xs font-bold"
          title={isCollapsed ? 'Expand team' : 'Collapse team'}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}
    </div>
  )
}
