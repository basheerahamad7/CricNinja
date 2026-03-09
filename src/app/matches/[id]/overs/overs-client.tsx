"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  History,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMatchStore, BallRecord } from '@/lib/match-store';

export default function OversClient() {
  const { id } = useParams();
  const router = useRouter();
  const { matches } = useMatchStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const matchId = Array.isArray(id) ? id[0] : id;
  const match = useMemo(() => matches.find(m => m.id === matchId), [matches, matchId]);

  if (!mounted) return null;
  if (!match) return <div className="p-8 text-center font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Match not found</div>;

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
    <div className="min-h-screen bg-background pb-20 font-body">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push(`/matches/scoring?id=${matchId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-sm leading-none text-foreground uppercase tracking-tight">Timeline</h1>
            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1 block">Innings {match.currentInnings}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-black uppercase border-border text-foreground">
           {currentInnings.totalRuns}/{currentInnings.totalWickets}
        </Badge>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <div className="bg-card p-6 rounded-[2rem] shadow-xl ring-1 ring-border">
          <div className="flex items-center gap-2 mb-8">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Ball by Ball</h2>
          </div>

          <div className="space-y-10">
            {currentInnings.overs.slice().reverse().map((over, revIndex) => {
              const actualIndex = currentInnings.overs.length - 1 - revIndex;
              const bowlerName = bowlingTeam.players.find(p => p.id === over.bowlerId)?.name || 'Unknown Bowler';
              const overRuns = over.balls.reduce((acc, b) => acc + b.runs + (b.extraType === 'wide' || b.extraType === 'noBall' ? 1 : 0), 0);
              
              return (
                <div key={actualIndex} className="space-y-5">
                  <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl ring-1 ring-border/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Over {actualIndex + 1}</span>
                      <span className="text-sm font-black text-foreground uppercase mt-0.5">{bowlerName}</span>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">
                      {overRuns} Runs
                    </Badge>
                  </div>
                  
                  <div className="flex gap-3 flex-wrap px-1">
                    {over.balls.map((ball, bIndex) => (
                      <div 
                        key={bIndex} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black border-2 shadow-lg transition-transform active:scale-95 tabular-nums
                          ${ball.isWicket ? 'bg-destructive border-destructive/20 text-destructive-foreground' : 
                            ball.runs >= 4 ? 'bg-secondary border-secondary/20 text-secondary-foreground' :
                            ball.isExtra ? 'bg-amber-500 border-amber-600/20 text-white' :
                            'bg-muted border-border text-foreground'}`}
                      >
                        {getBallDisplay(ball)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {currentInnings.overs.length === 0 && (
              <div className="text-center py-20 opacity-40">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">
                  No overs recorded yet
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <p className="text-[10px] font-black text-primary uppercase leading-relaxed tracking-wider">
            History is listed from most recent over to first over.
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-md border-t p-4 safe-paddings shadow-2xl">
        <Button 
          className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          onClick={() => router.push(`/matches/scoring?id=${matchId}`)}
        >
          Return to Scoring
        </Button>
      </footer>
    </div>
  );
}
