'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  UserCredential,
} from 'firebase/auth';

/** Initiate Google sign-in with popup, falling back to redirect if popup is blocked. */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential | undefined> {
  const provider = new GoogleAuthProvider();
  try {
    return await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      console.warn("Popup blocked by browser. Falling back to Google redirect sign-in...");
      await signInWithRedirect(authInstance, provider);
      return undefined;
    }
    console.error("Google sign-in error:", error);
    throw error;
  }
}
