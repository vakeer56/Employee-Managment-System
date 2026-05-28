import { useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
}

/**
 * SearchBar — searches employees by name, designation, or department.
 * Shows a result count badge when results are found.
 * Clears with Escape or the ✕ button.
 */
export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onChange('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative flex items-center max-w-sm w-full">
      {/* Search icon */}
      <span className="absolute left-3 text-gray-400 text-sm pointer-events-none">🔍</span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search by name, role, or department…"
        className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
      />

      {/* Result badge or clear button */}
      {value && (
        <div className="absolute right-3 flex items-center gap-1.5">
          {resultCount > 0 && (
            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
              {resultCount}
            </span>
          )}
          <button
            onClick={() => onChange('')}
            className="text-gray-400 hover:text-gray-600 text-sm leading-none"
            title="Clear search"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
