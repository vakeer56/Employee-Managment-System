import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../services/firebase'
import { fetchUserProfile } from '../services/authService'
import { getEmployeeByAuthEmail } from '../services/employeeProfileService'
import type { AppUser } from '../types/user'
import type { Employee } from '../types/employee'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [employeeRecord, setEmployeeRecord] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return

      setLoading(true)
      setFirebaseUser(user)
      setProfileError(null)

      try {
        if (user) {
          const userProfile = await fetchUserProfile(user.uid)
          let empRecord: Employee | null = null
          if (user.email) {
            empRecord = await getEmployeeByAuthEmail(user.email)
          }
          if (isMounted) {
            setProfile(userProfile)
            setEmployeeRecord(empRecord)
          }
        } else if (isMounted) {
          setProfile(null)
          setEmployeeRecord(null)
        }
      } catch (error) {
        console.error('Failed to load user profile.', error)
        if (isMounted) {
          setProfile(null)
          setEmployeeRecord(null)
          setProfileError(
            'Unable to load your profile. Check Firestore permissions for your user document.',
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, employeeRecord, loading, profileError, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
