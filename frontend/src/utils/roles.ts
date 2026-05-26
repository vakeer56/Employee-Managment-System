import type { UserRole } from '../types/user'

/** Check if the user's role is in the allowed list */
export function hasRole(
  userRole: UserRole | undefined,
  allowedRoles: UserRole[],
): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}
