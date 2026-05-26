import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../services/firebase'
import { fetchUserProfile } from '../services/authService'
import type { AppUser } from '../types/user'

interface AuthContextValue {
  firebaseUser: User | null
  profile: AppUser | null
  loading: boolean
  setProfile: (profile: AppUser | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (user) {
        const userProfile = await fetchUserProfile(user.uid)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
