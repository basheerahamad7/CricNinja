"use client";

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineErrorBannerProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function OfflineErrorBanner({
  message = "Could not connect to CricNinja servers. Check your connection.",
  onRetry,
  isRetrying = false,
}: OfflineErrorBannerProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-3xl p-5 text-center space-y-3">
      <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
        <WifiOff className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="font-headline font-black text-sm uppercase tracking-tight text-destructive">
          Connection Issue
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium">
          {message}
        </p>
      </div>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        className="h-10 rounded-xl px-5 font-black uppercase text-[10px] tracking-widest gap-2 text-white"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying...' : 'Retry Connection'}
      </Button>
    </div>
  );
}
