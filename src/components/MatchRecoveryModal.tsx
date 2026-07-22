"use client";

import React from 'react';
import { Match } from '@/lib/match-store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Trash2 } from 'lucide-react';

interface MatchRecoveryModalProps {
  isOpen: boolean;
  match: Match | null;
  onResume: () => void;
  onDiscard: () => void;
}

export function MatchRecoveryModal({
  isOpen,
  match,
  onResume,
  onDiscard,
}: MatchRecoveryModalProps) {
  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="rounded-3xl max-w-sm text-center">
        <DialogHeader className="space-y-2">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-md">
            <PlayCircle className="w-8 h-8" />
          </div>
          <DialogTitle className="font-headline font-black text-xl uppercase tracking-tight">
            Unfinished Match Found
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Would you like to resume scoring your previous match?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 text-left space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-black text-xs uppercase">{match.teamA?.name} vs {match.teamB?.name}</p>
            <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/40 text-primary">
              Overs {match.totalOvers}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            {match.currentInnings === 1 ? '1st Innings' : '2nd Innings'} • Scored locally
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col pt-2">
          <Button
            onClick={onResume}
            className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest gap-2 text-white shadow-md"
          >
            <PlayCircle className="w-4 h-4" /> Resume Match
          </Button>
          <Button
            variant="ghost"
            onClick={onDiscard}
            className="w-full h-10 rounded-2xl text-xs font-bold uppercase text-destructive gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Discard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
