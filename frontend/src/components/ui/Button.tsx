import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
      : 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'

  return (
    <button
      className={`${base} ${styles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}
