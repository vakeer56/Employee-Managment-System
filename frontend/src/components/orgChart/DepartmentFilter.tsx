interface DepartmentFilterProps {
  departments: string[]
  selected: string
  onChange: (dept: string) => void
}

const DEPT_DOT: Record<string, string> = {
  Engineering: 'bg-blue-500',
  HR:          'bg-pink-500',
  Finance:     'bg-green-500',
  Marketing:   'bg-orange-500',
  Operations:  'bg-purple-500',
  Sales:       'bg-yellow-500',
  Design:      'bg-rose-500',
  Product:     'bg-cyan-500',
}

/**
 * DepartmentFilter — a pill-style filter bar.
 * "All" shows the full org chart; selecting a department filters to that dept's
 * employees only (the hierarchy is rebuilt from filtered employees).
 */
export function DepartmentFilter({ departments, selected, onChange }: DepartmentFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('')}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
          selected === ''
            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
      >
        🏢 All
      </button>

      {departments.map((dept) => (
        <button
          key={dept}
          onClick={() => onChange(dept)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
            selected === dept
              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              DEPT_DOT[dept] ?? 'bg-gray-400'
            } ${selected === dept ? 'bg-white' : ''}`}
          />
          {dept}
        </button>
      ))}
    </div>
  )
}
