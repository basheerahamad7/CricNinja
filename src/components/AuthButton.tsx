"use client";

import React, { useState, useRef } from 'react';
import { useUser, useAuth, isUserAuthenticated } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { LogOut, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AuthButton() {
  const { user, isUserLoading, userProfile } = useUser();
  const auth = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const signInLockRef = useRef(false);

  const handleGoogleSignIn = async () => {
    // Synchronous guard against rapid double-clicks & concurrent requests
    if (signInLockRef.current || isSigningIn) {
      return;
    }

    signInLockRef.current = true;
    setIsSigningIn(true);
    try {
      await initiateGoogleSignIn(auth);
      toast({
        title: "Signed in successfully!",
        description: "Welcome to CricNinja.",
      });
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error toast needed
        return;
      }
      if (error?.code === 'auth/configuration-not-found' || error?.code === 'auth/operation-not-allowed') {
        toast({
          variant: "destructive",
          title: "Google Sign-In Not Enabled",
          description: "Please enable Google Sign-in in your Firebase Console under Authentication.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign-in failed",
          description: error?.message || "Could not sign in with Google.",
        });
      }
    } finally {
      signInLockRef.current = false;
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have signed out successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign-out failed",
        description: "Could not sign out. Please try again.",
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    );
  }

  const currentUser = user || auth?.currentUser;
  const authenticated = isUserAuthenticated(currentUser);

  if (authenticated && currentUser) {
    const photoURL = currentUser.photoURL || userProfile?.account?.photoURL || '';
    const name = currentUser.displayName || userProfile?.account?.displayName || 'User';
    const initials = name
      ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            <Avatar className="h-9 w-9">
              {photoURL && <AvatarImage src={photoURL} alt={name} />}
              <AvatarFallback className="bg-primary text-primary-foreground font-headline font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-2xl p-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-headline font-bold leading-none">{currentUser.displayName || "CricNinja User"}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive cursor-pointer rounded-xl font-bold text-xs gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isSigningIn}
      onClick={handleGoogleSignIn}
      className="rounded-full border-primary/30 hover:border-primary text-foreground font-black uppercase text-[10px] gap-2 h-9 px-3 shadow-xs"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      {isSigningIn ? "Signing In..." : "Google Sign In"}
    </Button>
  );
}
