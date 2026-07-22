'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in with popup (links anonymous account if present). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential | undefined> {
  const provider = new GoogleAuthProvider();
  try {
    if (authInstance.currentUser && authInstance.currentUser.isAnonymous) {
      try {
        return await linkWithPopup(authInstance.currentUser, provider);
      } catch (error: any) {
        if (error?.code !== 'auth/credential-already-in-use') {
          console.warn("Account link error, falling back to sign-in:", error);
        }
      }
    }
    return await signInWithPopup(authInstance, provider);
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}
