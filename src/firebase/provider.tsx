'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { Database } from 'firebase/database';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { CricNinjaUser } from '@/types/user';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: CricNinjaUser | null;
  isProfileLoading: boolean;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  database: Database | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: CricNinjaUser | null;
  isProfileLoading: boolean;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  database: Database;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: CricNinjaUser | null;
  isProfileLoading: boolean;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: CricNinjaUser | null;
  isProfileLoading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  database,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    userProfile: null,
    isProfileLoading: true,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ 
        user: null, 
        isUserLoading: false, 
        userError: new Error("Auth service not provided."),
        userProfile: null,
        isProfileLoading: false,
      });
      return;
    }

    setUserAuthState(prev => ({ ...prev, isUserLoading: true }));

    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }

        if (firebaseUser && firestore) {
          setUserAuthState({ 
            user: firebaseUser, 
            isUserLoading: false, 
            userError: null, 
            userProfile: null, 
            isProfileLoading: true 
          });

          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          profileUnsubscribe = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                setUserAuthState({
                  user: firebaseUser,
                  isUserLoading: false,
                  userError: null,
                  userProfile: docSnap.data() as CricNinjaUser,
                  isProfileLoading: false,
                });
              } else {
                setUserAuthState({
                  user: firebaseUser,
                  isUserLoading: false,
                  userError: null,
                  userProfile: null,
                  isProfileLoading: false,
                });
              }
            },
            (err) => {
              console.error("FirebaseProvider: user profile snapshot error:", err);
              setUserAuthState({
                user: firebaseUser,
                isUserLoading: false,
                userError: null,
                userProfile: null,
                isProfileLoading: false,
              });
            }
          );
        } else {
          setUserAuthState({ 
            user: null, 
            isUserLoading: false, 
            userError: null, 
            userProfile: null, 
            isProfileLoading: false 
          });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ 
          user: null, 
          isUserLoading: false, 
          userError: error, 
          userProfile: null, 
          isProfileLoading: false 
        });
      }
    );

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && database);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      database: servicesAvailable ? database : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      userProfile: userAuthState.userProfile,
      isProfileLoading: userAuthState.isProfileLoading,
    };
  }, [firebaseApp, firestore, auth, database, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.database) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    database: context.database,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isProfileLoading: context.isProfileLoading,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, userProfile, isProfileLoading } = useFirebase();
  return { user, isUserLoading, userError, userProfile, isProfileLoading };
};
