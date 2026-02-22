"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  History,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMatchStore, BallRecord } from '@/lib/match-store';

function OversContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');
  const { matches } = useMatchStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const match = useMemo(() => matches.find(m => m.id === matchId), [matches, matchId]);

  if (!mounted) return null;
  if (!match) return <div className="p-8 text-center font-bold">Match not found</div>;

  const currentInnings = match.currentInnings === 1 ? match.innings1 : match.innings2;
  const bowlingTeam = match.teamA.id === currentInnings.battingTeamId ? match.teamB : match.teamA;

  const getBallDisplay = (ball: BallRecord) => {
    if (ball.isWicket) return ball.runs > 0 ? `${ball.runs}W` : 'W';
    if (ball.extraType === 'wide') return `WD`;
    if (ball.extraType === 'noBall') return `NB`;
    if (ball.extraType === 'bye') return `${ball.runs}B`;
    if (ball.extraType === 'legBye') return `${ball.runs}LB`;
    return ball.runs.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-body">
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push(`/matches/scoring?id=${matchId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm leading-none">Match Timeline</h1>
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Innings {match.currentInnings}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold">
           {currentInnings.totalRuns}/{currentInnings.totalWickets}
        </Badge>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight">Ball by Ball History</h2>
          </div>

          <div className="space-y-8">
            {currentInnings.overs.slice().reverse().map((over, revIndex) => {
              const actualIndex = currentInnings.overs.length - 1 - revIndex;
              const bowlerName = bowlingTeam.players.find(p => p.id === over.bowlerId)?.name || 'Unknown Bowler';
              const overRuns = over.balls.reduce((acc, b) => acc + b.runs + (b.extraType === 'wide' || b.extraType === 'noBall' ? 1 : 0), 0);
              
              return (
                <div key={actualIndex} className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl ring-1 ring-gray-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Over {actualIndex + 1}</span>
                      <span className="text-sm font-bold text-gray-700">{bowlerName}</span>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold">
                      {overRuns} Runs
                    </Badge>
                  </div>
                  
                  <div className="flex gap-3 flex-wrap px-1">
                    {over.balls.map((ball, bIndex) => (
                      <div 
                        key={bIndex} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black border-2 shadow-md transition-transform active:scale-95
                          ${ball.isWicket ? 'bg-red-500 border-red-600 text-white' : 
                            ball.runs >= 4 ? 'bg-secondary border-secondary text-white' :
                            ball.isExtra ? 'bg-amber-500 border-amber-600 text-white' :
                            'bg-primary border-primary text-white'}`}
                      >
                        {getBallDisplay(ball)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {currentInnings.overs.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">
                  No overs recorded yet
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-blue-50/50 rounded-2xl flex items-center gap-3">
          <Info className="w-4 h-4 text-blue-400" />
          <p className="text-[10px] font-bold text-blue-600 uppercase leading-relaxed tracking-wider">
            History is listed from most recent over to first over.
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t p-4 safe-paddings">
        <Button 
          className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest"
          onClick={() => router.push(`/matches/scoring?id=${matchId}`)}
        >
          Return to Scoring
        </Button>
      </footer>
    </div>
  );
}

export default function OversPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Timeline...</div>}>
      <OversContent />
    </Suspense>
  );
}
