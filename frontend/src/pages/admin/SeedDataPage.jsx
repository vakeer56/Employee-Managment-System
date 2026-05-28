/**
 * SeedDataPage.jsx
 *
 * Admin-only page to seed Firestore with dummy HRMS data.
 *
 * Features:
 *  - "Seed Database" button  → runs the seed script
 *  - "Clear All Seed Data"   → wipes departments/employees/attendance/leaves
 *  - Live progress log shown during operation
 *  - Success / error toasts
 *
 * Route:  /admin/seed-data   (add to AppRoutes.tsx)
 * Access: super_admin only (enforced by ProtectedRoute + allowedRoles)
 */

import { useState, useRef } from 'react'
import { db } from '../../services/firebase'
import { runSeed, clearSeedData } from '../../scripts/seedDatabase'

// ─── tiny inline toast component ──────────────────────────────────────────────
function Toast({ type, message, onClose }) {
  if (!message) return null

  const styles = {
    success: {
      bg: '#dcfce7',
      border: '#86efac',
      icon: '✅',
      color: '#166534',
    },
    error: {
      bg: '#fee2e2',
      border: '#fca5a5',
      icon: '❌',
      color: '#991b1b',
    },
    info: {
      bg: '#dbeafe',
      border: '#93c5fd',
      icon: 'ℹ️',
      color: '#1e40af',
    },
  }[type] || {
    bg: '#f3f4f6',
    border: '#d1d5db',
    icon: '💬',
    color: '#111827',
  }

  return (
    <div
      role="alert"
      style={{
        background: styles.bg,
        border: `1.5px solid ${styles.border}`,
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{styles.icon}</span>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: styles.color,
          whiteSpace: 'pre-line',
          flex: 1,
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: styles.color,
          opacity: 0.6,
          flexShrink: 0,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

// ─── spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: 18,
        height: 18,
        border: '3px solid rgba(255,255,255,0.35)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        verticalAlign: 'middle',
        marginRight: 8,
      }}
    />
  )
}

// ─── main page ────────────────────────────────────────────────────────────────
export function SeedDataPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [progressLog, setProgressLog] = useState([])
  const [toast, setToast] = useState(null) // { type, message }
  const logEndRef = useRef(null)

  /** Append a line to the live progress log and scroll to bottom */
  function appendLog(msg) {
    setProgressLog((prev) => [...prev, msg])
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function showToast(type, message) {
    setToast({ type, message })
  }

  // ── Seed handler ────────────────────────────────────────────────────────────
  async function handleSeed() {
    setToast(null)
    setProgressLog([])
    setIsSeeding(true)

    const result = await runSeed(db, {
      force: false,
      onProgress: appendLog,
    })

    setIsSeeding(false)

    if (result.success) {
      showToast('success', result.message)
    } else {
      showToast('error', result.message)
    }
  }

  // ── Force re-seed handler (clear + seed) ────────────────────────────────────
  async function handleForceSeed() {
    const confirmed = window.confirm(
      '⚠️ This will DELETE all existing data in departments, employees, attendance, and leaves, then re-seed.\n\nAre you sure?'
    )
    if (!confirmed) return

    setToast(null)
    setProgressLog([])
    setIsSeeding(true)

    appendLog('Clearing old data first…')
    const clearResult = await clearSeedData(db, { onProgress: appendLog })

    if (!clearResult.success) {
      showToast('error', clearResult.message)
      setIsSeeding(false)
      return
    }

    appendLog('Starting fresh seed…')
    const seedResult = await runSeed(db, { force: true, onProgress: appendLog })

    setIsSeeding(false)

    if (seedResult.success) {
      showToast('success', seedResult.message)
    } else {
      showToast('error', seedResult.message)
    }
  }

  // ── Clear handler ────────────────────────────────────────────────────────────
  async function handleClear() {
    const confirmed = window.confirm(
      '⚠️ This will permanently delete ALL documents in departments, employees, attendance, and leaves.\n\nContinue?'
    )
    if (!confirmed) return

    setToast(null)
    setProgressLog([])
    setIsClearing(true)

    const result = await clearSeedData(db, { onProgress: appendLog })

    setIsClearing(false)

    if (result.success) {
      showToast('success', result.message)
    } else {
      showToast('error', result.message)
    }
  }

  const isBusy = isSeeding || isClearing

  return (
    <>
      {/* Keyframe for spinner — injected once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .seed-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .seed-btn:active:not(:disabled) { transform: translateY(0); }
        .seed-btn { transition: filter 0.15s, transform 0.15s, box-shadow 0.15s; }
        .seed-btn:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
      `}</style>

      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '32px 24px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1
            id="seed-page-title"
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              letterSpacing: '-0.4px',
            }}
          >
            🌱 Seed Database
          </h1>
          <p style={{ marginTop: 6, color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
            Populate Firestore with realistic HRMS dummy data for development and testing.
            This includes{' '}
            <strong>departments</strong>, <strong>employees</strong>,{' '}
            <strong>attendance records</strong>, and <strong>leave requests</strong>.
          </p>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* ── Info card ── */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#374151' }}>
            What will be seeded?
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#4b5563', fontSize: 14, lineHeight: 2 }}>
            <li><strong>6 departments</strong> — Engineering, HR, Finance, Marketing, Operations, Sales</li>
            <li><strong>25 employees</strong> — CEO → Managers → Employees (with managerId hierarchy)</li>
            <li><strong>~450 attendance records</strong> — last 30 working days per employee</li>
            <li><strong>~50–75 leave requests</strong> — Casual, Sick, Earned Leave, WFH</li>
          </ul>
        </div>

        {/* ── Action Buttons ── */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {/* Primary: Seed */}
          <button
            id="btn-seed-database"
            className="seed-btn"
            onClick={handleSeed}
            disabled={isBusy}
            style={{
              background: isBusy ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isSeeding && <Spinner />}
            {isSeeding ? 'Seeding…' : '🚀 Seed Database'}
          </button>

          {/* Secondary: Force re-seed */}
          <button
            id="btn-force-reseed"
            className="seed-btn"
            onClick={handleForceSeed}
            disabled={isBusy}
            style={{
              background: isBusy ? '#e5e7eb' : '#fff',
              color: isBusy ? '#9ca3af' : '#374151',
              border: '1.5px solid #d1d5db',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isSeeding && <Spinner />}
            🔄 Clear & Re-seed
          </button>

          {/* Danger: Clear */}
          <button
            id="btn-clear-seed-data"
            className="seed-btn"
            onClick={handleClear}
            disabled={isBusy}
            style={{
              background: isBusy ? '#fee2e2' : '#fff',
              color: isBusy ? '#fca5a5' : '#dc2626',
              border: '1.5px solid #fca5a5',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isClearing && <Spinner />}
            {isClearing ? 'Clearing…' : '🗑️ Clear Seed Data'}
          </button>
        </div>

        {/* ── Progress log ── */}
        {progressLog.length > 0 && (
          <div
            aria-live="polite"
            aria-label="Seed progress log"
            style={{
              background: '#0f172a',
              borderRadius: 12,
              padding: '16px 20px',
              maxHeight: 280,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.8,
            }}
          >
            <p style={{ margin: '0 0 10px', color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
              PROGRESS LOG
            </p>
            {progressLog.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith('✓') || line.startsWith('🎉')
                    ? '#4ade80'
                    : line.startsWith('  …')
                    ? '#94a3b8'
                    : '#e2e8f0',
                }}
              >
                {line}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}

        {/* ── Help section ── */}
        <div
          style={{
            marginTop: 36,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 24,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 14px' }}>
            ℹ️ How it works
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {[
              {
                title: 'Duplicate prevention',
                desc: '"Seed Database" checks if the departments collection already has data before inserting. It will refuse to run twice. Use "Clear & Re-seed" to start fresh.',
              },
              {
                title: 'Clearing data',
                desc: '"Clear Seed Data" deletes all documents from departments, employees, attendance, and leaves. Use this before re-seeding or before going to production.',
              },
              {
                title: 'Hierarchy',
                desc: 'Employees are inserted in order so managerId references always point to existing Firestore document IDs. CEO has no manager (empty string).',
              },
              {
                title: 'Batch writes',
                desc: 'Attendance and leave records are written using writeBatch() for efficiency. Batches are committed every 450 ops (safely below Firestore\'s 500 limit).',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: '#111827' }}>
                  {item.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
