"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Shield } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading, userProfile, isProfileLoading } = useUser();

  const isOnboardingPage = pathname === '/onboarding';
  const isProtectedRoute = 
    pathname === '/profile' || 
    pathname === '/matches/create' || 
    pathname.includes('/scoring');

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    // Unauthenticated user attempting to access protected route
    if (!user && isProtectedRoute) {
      router.replace('/onboarding');
      return;
    }

    // Authenticated user with incomplete profile attempting to access protected route
    if (user && (!userProfile || !userProfile.profileCompleted) && isProtectedRoute) {
      router.replace('/onboarding');
      return;
    }

    // Authenticated user WITH completed profile visiting onboarding
    if (user && userProfile?.profileCompleted && isOnboardingPage) {
      router.replace('/');
      return;
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, pathname, router, isOnboardingPage, isProtectedRoute]);

  // Prevent UI flash during initial auth resolution or protected route profile loading
  if (isUserLoading || (isProtectedRoute && user && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4 select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-headline font-black text-sm uppercase tracking-widest text-primary">CRICNINJA</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of protected content while redirecting
  if (!user && isProtectedRoute) {
    return null;
  }

  if (user && (!userProfile || !userProfile.profileCompleted) && isProtectedRoute) {
    return null;
  }

  if (user && userProfile?.profileCompleted && isOnboardingPage) {
    return null;
  }

  return <>{children}</>;
}
