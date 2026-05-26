/** Roles used across the HRMS. Stored in Firestore on each user document. */
export type UserRole = 'super_admin' | 'hr_admin' | 'manager' | 'employee'

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'hr_admin', label: 'HR Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

/** Profile stored in Firestore at `users/{uid}` */
export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: string
}
