import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { AppUser, UserRole } from '../types/user'

const usersCollection = 'users'

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'employee',
): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const profile: AppUser = {
    uid: credential.user.uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
  }

  await setDoc(doc(db, usersCollection, credential.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  })

  return profile
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}

/**
 * Sends a password reset email (Firebase handles the link).
 * For privacy, Firebase does not tell us if the email exists — same success either way.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim())
  } catch {
    throw new Error(
      'Could not send reset email. Check the address and try again.',
    )
  }
}

export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(db, usersCollection, uid))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    createdAt:
      typeof data.createdAt === 'string'
        ? data.createdAt
        : data.createdAt?.toDate?.()?.toISOString() ?? '',
  }
}
