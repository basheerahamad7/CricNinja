"use client";

import React from 'react';
import { SyncStatusState } from '@/lib/offline-sync';
import { Badge } from '@/components/ui/badge';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SyncStatusIndicatorProps {
  status: SyncStatusState;
  pendingCount?: number;
  onSyncClick?: () => void;
}

export function SyncStatusIndicator({
  status,
  pendingCount = 0,
  onSyncClick,
}: SyncStatusIndicatorProps) {
  if (status === 'synced') {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-black text-[9px] uppercase tracking-wider gap-1.5 py-1 px-2.5"
      >
        <CheckCircle2 className="w-3 h-3" /> Synced
      </Badge>
    );
  }

  if (status === 'syncing') {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-black text-[9px] uppercase tracking-wider gap-1.5 py-1 px-2.5"
      >
        <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
      </Badge>
    );
  }

  if (status === 'offline') {
    return (
      <Badge
        variant="outline"
        className="bg-destructive/10 text-destructive border-destructive/30 font-black text-[9px] uppercase tracking-wider gap-1.5 py-1 px-2.5"
      >
        <WifiOff className="w-3 h-3" /> Offline
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      onClick={onSyncClick}
      className="bg-amber-500/10 text-amber-600 border-amber-500/40 font-black text-[9px] uppercase tracking-wider gap-1.5 py-1 px-2.5 cursor-pointer hover:bg-amber-500/20"
    >
      <AlertCircle className="w-3 h-3" /> {pendingCount > 0 ? `${pendingCount} Pending` : 'Pending Upload'}
    </Badge>
  );
}
