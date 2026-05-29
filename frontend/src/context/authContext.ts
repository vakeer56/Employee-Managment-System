import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { AppUser } from '../types/user'
import type { Employee } from '../types/employee'

export interface AuthContextValue {
  firebaseUser: User | null
  profile: AppUser | null
  employeeRecord: Employee | null
  loading: boolean
  profileError: string | null
  setProfile: (profile: AppUser | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
