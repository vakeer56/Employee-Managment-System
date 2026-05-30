/**
/**
 * emailService.ts
 *
 * Placeholder service for sending email notifications.
 * Consists of email template generators and a console-log placeholder
 * for sending emails, allowing actual providers (e.g. SendGrid, Nodemailer)
 * to be integrated later.
 */

export interface EmailPayload {
  to: string
  subject: string
  body: string
}

/** Placeholder function that logs the email details in the developer console. */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log(
    `%c[EMAIL SERVICE]%c Email sent successfully!
    To: ${payload.to}
    Subject: ${payload.subject}
    --------------------------------------------------
    ${payload.body}
    --------------------------------------------------`,
    'color: #6366f1; font-weight: bold;',
    'color: inherit;'
  )
}

// ─────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────

export const emailTemplates = {
  /** Leave Request Submitted */
  leaveSubmitted: (employeeName: string, startDate: string, endDate: string, type: string): EmailPayload => ({
    to: '', // To be filled dynamically by caller (e.g. Manager's email)
    subject: `Leave Request Submitted: ${employeeName}`,
    body: `Hello,

${employeeName} has submitted a new leave request.

Details:
- Type: ${type}
- Duration: ${startDate} to ${endDate}

Please login to the HRMS Dashboard to review and act on this request.

Regards,
HRMS Portal`,
  }),

  /** Leave Status Update (Approved / Rejected) */
  leaveStatusUpdated: (
    employeeEmail: string,
    employeeName: string,
    status: 'APPROVED' | 'REJECTED',
    startDate: string,
    endDate: string,
    remarks?: string
  ): EmailPayload => ({
    to: employeeEmail,
    subject: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    body: `Hello ${employeeName},

Your leave request from ${startDate} to ${endDate} has been ${status.toLowerCase()} by your manager.

${remarks ? `Manager Remarks: ${remarks}` : ''}

Regards,
HRMS Portal`,
  }),

  /** Payroll Generated / Salary Slip Available */
  payrollGenerated: (
    employeeEmail: string,
    employeeName: string,
    month: string,
    year: number,
    netSalary: number
  ): EmailPayload => ({
    to: employeeEmail,
    subject: `Salary Slip Available: ${month} ${year}`,
    body: `Hello ${employeeName},

Your salary slip for ${month} ${year} has been generated.

- Net Payout: INR ${netSalary.toLocaleString('en-IN')}

You can view and download your full salary slip from the "My Payroll" section in the HRMS Portal.

Regards,
HRMS Portal`,
  }),

  /** Birthday Greetings */
  birthdayGreeting: (employeeEmail: string, employeeName: string): EmailPayload => ({
    to: employeeEmail,
    subject: `Happy Birthday, ${employeeName}! 🎂`,
    body: `Hello ${employeeName},

Wishing you a very Happy Birthday! 🎉
Thank you for being a valuable member of our team. Have a wonderful day ahead!

Warm regards,
Everyone at HRMS`,
  }),

  /** Work Anniversary Greetings */
  workAnniversaryGreeting: (
    employeeEmail: string,
    employeeName: string,
    years: number
  ): EmailPayload => ({
    to: employeeEmail,
    subject: `Happy Work Anniversary, ${employeeName}! 🌟`,
    body: `Hello ${employeeName},

Happy Work Anniversary! 🌟
Congratulations on completing ${years} ${years === 1 ? 'year' : 'years'} with the company.
Thank you for your dedication, hard work, and contributions to our success!

Warm regards,
Everyone at HRMS`,
  }),

  /** Corporate System Announcement */
  announcement: (
    employeeEmail: string,
    title: string,
    message: string,
    author: string
  ): EmailPayload => ({
    to: employeeEmail,
    subject: `Company Announcement: ${title}`,
    body: `Hello,

A new corporate announcement has been published by ${author}:

--------------------------------------------------
${title}
--------------------------------------------------
${message}

You can view the full details under Announcements in the HRMS Portal.

Regards,
HRMS Portal`,
  }),
}
