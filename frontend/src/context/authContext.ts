import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { AppUser } from '../types/user'

export interface AuthContextValue {
  firebaseUser: User | null
  profile: AppUser | null
  loading: boolean
  profileError: string | null
  setProfile: (profile: AppUser | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
