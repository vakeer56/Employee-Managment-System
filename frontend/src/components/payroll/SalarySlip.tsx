/**
 * SalarySlip.tsx
 *
 * Printable salary slip component.
 * Used in SalarySlipPage — renders the full slip and provides a Print button.
 */

import { formatCurrency, monthLabel } from '../../types/payroll'
import type { PayrollRecord } from '../../types/payroll'

interface Props {
  record: PayrollRecord
}

export function SalarySlip({ record }: Props) {
  function handlePrint() {
    window.print()
  }

  return (
    <div>
      {/* Print button — hidden when printing */}
      <div className="mb-6 flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* ── Slip body (this gets printed) ── */}
      <div
        id="salary-slip-print"
        className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:shadow-none print:border-none print:max-w-full"
      >
        {/* Header */}
        <div className="mb-6 border-b border-gray-200 pb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">HRMS</h1>
          <p className="text-sm text-gray-500 mt-1">Employee Salary Slip</p>
        </div>

        {/* Pay period */}
        <div className="mb-5 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-center">
          <p className="text-lg font-semibold text-indigo-800">
            {monthLabel(record.month)} {record.year}
          </p>
        </div>

        {/* Employee info */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Employee Information
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Name" value={record.employeeName} />
            <Row label="Employee ID" value={record.employeeCode} />
            <Row label="Department" value={record.department || '—'} />
            <Row label="Generated On" value={new Date(record.generatedAt).toLocaleDateString('en-IN')} />
          </div>
        </section>

        {/* Earnings */}
        <section className="mb-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Earnings
          </h2>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Component</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <SlipRow label="Basic Pay" value={record.basicPay} />
                <SlipRow label="HRA (House Rent Allowance)" value={record.hra} />
                <SlipRow label="Other Allowances" value={record.allowances} />
                {record.bonus > 0 && <SlipRow label="Bonus" value={record.bonus} highlight />}
              </tbody>
              <tfoot className="bg-green-50">
                <tr>
                  <td className="px-4 py-3 font-semibold text-green-800">Gross Salary</td>
                  <td className="px-4 py-3 text-right font-bold text-green-800">
                    {formatCurrency(record.grossSalary)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Deductions */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Deductions
          </h2>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Component</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <SlipRow label="Income Tax" value={record.tax} negative />
                <SlipRow label="Fixed Deductions (PF / Other)" value={record.deductions} negative />
              </tbody>
              <tfoot className="bg-red-50">
                <tr>
                  <td className="px-4 py-3 font-semibold text-red-700">Total Deductions</td>
                  <td className="px-4 py-3 text-right font-bold text-red-700">
                    {formatCurrency(record.tax + record.deductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Net salary — prominent */}
        <div className="rounded-xl border-2 border-indigo-500 bg-indigo-600 px-6 py-5 text-center text-white">
          <p className="text-sm opacity-80">Net Salary (Take Home)</p>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(record.netSalary)}</p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          This is a system-generated salary slip. No signature required.
        </p>
      </div>
    </div>
  )
}

// ─── Helper sub-components ───────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </>
  )
}

function SlipRow({
  label,
  value,
  negative = false,
  highlight = false,
}: {
  label: string
  value: number
  negative?: boolean
  highlight?: boolean
}) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className={`px-4 py-2.5 ${highlight ? 'text-amber-700 font-medium' : 'text-gray-700'}`}>
        {label}
      </td>
      <td
        className={`px-4 py-2.5 text-right font-medium ${
          negative ? 'text-red-600' : highlight ? 'text-amber-700' : 'text-gray-800'
        }`}
      >
        {formatCurrency(value)}
      </td>
    </tr>
  )
}
