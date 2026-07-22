"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trophy, 
  Clock,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Match, BallRecord } from '@/lib/match-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BannerAd } from '@/components/BannerAd';
import { Separator } from '@/components/ui/separator';

export default function LiveClient() {
  const { id } = useParams();
  const router = useRouter();
  const { database: rtdb } = useFirebase();
  
  const [mounted, setMounted] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !rtdb || !id) return;

    const matchId = Array.isArray(id) ? id[0] : id;
    const matchRef = ref(rtdb, `matches/${matchId}`);
    
    const unsubscribe = onValue(
      matchRef, 
      (snapshot) => {
        const data = snapshot.val();
        setMatch(data);
        setIsLoading(false);
      }, 
      (error) => {
        console.error("RTDB Error:", error);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [mounted, id, rtdb]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Syncing Live Scoreboard...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Trophy className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Match Not Found</h2>
        <p className="text-muted-foreground text-xs font-bold uppercase mt-2">This match may have ended or the link is invalid.</p>
        <Button className="mt-8 rounded-2xl px-8 h-12 font-black uppercase tracking-widest shadow-lg text-white" onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const currentInnings = match.currentInnings === 1 ? match.innings1 : match.innings2;
  const battingTeam = match.teamA.id === currentInnings.battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam = match.teamA.id === currentInnings.battingTeamId ? match.teamB : match.teamA;
  
  const striker = battingTeam.players.find(p => p.id === match.currentStrikerId);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentNonStrikerId);
  const bowler = bowlingTeam.players.find(p => p.id === match.currentBowlerId);
  
  const lastBalls = currentInnings.overs?.[currentInnings.overs.length - 1]?.balls || [];

  const crr = currentInnings.totalBalls > 0 
    ? (currentInnings.totalRuns / (currentInnings.totalBalls / 6)) 
    : 0;

  const target = match.innings1.totalRuns + 1;
  const runsNeeded = target - currentInnings.totalRuns;
  const totalBallsMax = match.totalOvers * 6;
  const ballsRemaining = totalBallsMax - currentInnings.totalBalls;
  const rrr = match.currentInnings === 2 && ballsRemaining > 0
    ? (runsNeeded / (ballsRemaining / 6))
    : 0;

  const getBallDisplay = (ball: BallRecord) => {
    if (ball.isWicket) return ball.runs > 0 ? `${ball.runs}W` : 'W';
    if (ball.extraType === 'wide') return 'WD';
    if (ball.extraType === 'noBall') return 'NB';
    if (ball.extraType === 'bye') return `${ball.runs}B`;
    if (ball.extraType === 'legBye') return `${ball.runs}LB`;
    return ball.runs.toString();
  };

  return (
    <div className="min-h-screen bg-background pb-24 font-body">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-sm leading-none text-foreground">{battingTeam.name}</h2>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] text-primary uppercase font-black tracking-widest">LIVE SPECTATOR</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={`text-[9px] font-black uppercase ${match.status === 'ongoing' ? 'text-destructive border-destructive/20' : ''}`}>
          {match.status === 'ongoing' ? '🔴 LIVE' : 'MATCH OVER'}
        </Badge>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        <Card className="bg-card rounded-[2rem] overflow-hidden shadow-xl border-none ring-1 ring-border">
          <div className="bg-primary text-primary-foreground p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-none text-[10px] font-bold uppercase tracking-widest">
                  {match.currentInnings === 1 ? '1st Innings' : '2nd Innings'}
                </Badge>
                <h3 className="text-xl font-black truncate max-w-[180px] uppercase tracking-tight">{battingTeam.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black tabular-nums tracking-tighter">
                  {currentInnings.totalRuns}<span className="text-2xl opacity-60">/{currentInnings.totalWickets}</span>
                </div>
                <div className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">
                  Overs {Math.floor(currentInnings.totalBalls / 6)}.{currentInnings.totalBalls % 6} ({match.totalOvers})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-primary-foreground/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">CRR</span>
                <span className="text-lg font-black">{crr.toFixed(2)}</span>
              </div>
              {match.currentInnings === 2 && (
                <>
                  <Separator orientation="vertical" className="h-8 bg-primary-foreground/20" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">RRR</span>
                    <span className="text-lg font-black">{rrr.toFixed(2)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-primary-foreground/20" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">TARGET</span>
                    <span className="text-lg font-black">{target}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {match.status === 'completed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl p-4 text-center">
                <p className="font-headline font-black text-sm uppercase tracking-tight">Match Ended</p>
                <p className="text-[10px] font-bold uppercase mt-0.5">
                  {match.innings1.totalRuns > match.innings2.totalRuns 
                    ? `${match.teamA.name} won by ${match.innings1.totalRuns - match.innings2.totalRuns} runs!` 
                    : match.innings2.totalRuns > match.innings1.totalRuns 
                    ? `${match.teamB.name} won by ${10 - match.innings2.totalWickets} wickets!` 
                    : 'Match ended in a Tie!'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Recent Balls</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {lastBalls.length > 0 ? (
                  lastBalls.map((ball, idx) => (
                    <div 
                      key={idx} 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        ball.isWicket 
                          ? 'bg-destructive text-destructive-foreground' 
                          : ball.runs === 4 || ball.runs === 6 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {getBallDisplay(ball)}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground font-medium">No balls bowled in this over yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Current Batter & Bowler</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted/30 border-border p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-primary tracking-widest">STRIKER</span>
                  <p className="font-bold text-xs truncate">{striker?.name || 'Batsman'}</p>
                  <p className="text-xs font-black text-foreground tabular-nums">
                    {striker?.runs || 0} <span className="text-[10px] text-muted-foreground font-normal">({striker?.balls || 0})</span>
                  </p>
                </Card>
                <Card className="bg-muted/30 border-border p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">BOWLER</span>
                  <p className="font-bold text-xs truncate">{bowler?.name || 'Bowler'}</p>
                  <p className="text-xs font-black text-foreground tabular-nums">
                    {bowler?.wickets || 0}/{bowler?.runsConceded || 0} <span className="text-[10px] text-muted-foreground font-normal">({bowler?.oversBowled || 0} ov)</span>
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        <BannerAd />
      </main>
    </div>
  );
}
