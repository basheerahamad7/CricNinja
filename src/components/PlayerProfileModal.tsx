"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CricNinjaUser } from '@/types/user';
import { Trophy, Target, Zap, MapPin, CheckCircle2, Shield } from 'lucide-react';

interface PlayerProfileModalProps {
  player: CricNinjaUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerProfileModal({ player, isOpen, onClose }: PlayerProfileModalProps) {
  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md p-6 text-left space-y-5">
        <DialogHeader className="space-y-1">
          <div className="flex justify-between items-start">
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest">
              OFFICIAL PLAYER CARD
            </Badge>
            {player.social?.verified && (
              <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </Badge>
            )}
          </div>
          <DialogTitle className="font-headline font-black text-xl uppercase tracking-tight text-foreground">
            {player.account?.displayName}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-primary font-bold">
            @{player.account?.username || 'player'}
          </DialogDescription>
        </DialogHeader>

        {/* Avatar and Bio */}
        <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shrink-0 shadow-md">
            {player.account?.photoURL ? (
              <img src={player.account.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-lg text-primary">
                {player.account?.displayName?.[0] || 'P'}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[9px] font-black uppercase border-border text-muted-foreground">
                {player.cricket?.primaryRole?.replace('_', ' ') || 'Player'}
              </Badge>
              {player.cricket?.jerseyNumber && (
                <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black">
                  #{player.cricket.jerseyNumber}
                </Badge>
              )}
            </div>
            {player.location?.city && (
              <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> {player.location.city}, {player.location.country}
              </p>
            )}
            {player.account?.bio && (
              <p className="text-[11px] text-foreground/80 font-medium italic line-clamp-2">
                &ldquo;{player.account.bio}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-card border border-border p-3 rounded-2xl shadow-sm space-y-0.5">
            <Trophy className="w-4 h-4 text-amber-500 mx-auto" />
            <p className="text-[9px] font-black text-muted-foreground uppercase">RUNS</p>
            <p className="text-base font-black text-primary">{player.careerStats?.runs || 0}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-2xl shadow-sm space-y-0.5">
            <Target className="w-4 h-4 text-emerald-500 mx-auto" />
            <p className="text-[9px] font-black text-muted-foreground uppercase">WICKETS</p>
            <p className="text-base font-black text-foreground">{player.careerStats?.wickets || 0}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-2xl shadow-sm space-y-0.5">
            <Zap className="w-4 h-4 text-sky-500 mx-auto" />
            <p className="text-[9px] font-black text-muted-foreground uppercase">MATCHES</p>
            <p className="text-base font-black text-foreground">{player.careerStats?.matches || 0}</p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest text-white">
          Close Profile
        </Button>
      </DialogContent>
    </Dialog>
  );
}
