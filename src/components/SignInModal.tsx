"use client";

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AuthButton } from '@/components/AuthButton';
import { ShieldAlert } from 'lucide-react';
import { useUser, isUserAuthenticated } from '@/firebase';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SignInModal({
  isOpen,
  onClose,
  title = "Sign In Required",
  description = "You must be signed in with Google to start a new match or spectate live matches.",
}: SignInModalProps) {
  const { user } = useUser();

  // Automatically close modal when user logs in
  useEffect(() => {
    if (isUserAuthenticated(user) && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-center font-headline font-black text-xl uppercase tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2 flex justify-center">
          <AuthButton />
        </div>
      </DialogContent>
    </Dialog>
  );
}
