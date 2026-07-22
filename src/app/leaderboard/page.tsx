"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Leaderboard } from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 max-w-lg mx-auto space-y-6 pb-12 select-none">
      
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="font-headline font-black text-xl uppercase tracking-tight flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> LEADERBOARD
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            City • State • Country • Global
          </p>
        </div>
        <div className="w-10" />
      </header>

      {/* Main Leaderboard Component */}
      <Leaderboard />
    </div>
  );
}
