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
    
    const unsubscribe = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      setMatch(data);
      setIsLoading(false);
    }, (error) => {
      console.error("RTDB Error:", error);
      setIsLoading(false);
    });

    return () => off(matchRef, 'value', unsubscribe);
  }, [mounted, id, rtdb]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-bold text-gray-500">Syncing Live Scoreboard...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Trophy className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-2xl font-black text-gray-900">Match Not Found</h2>
        <p className="text-gray-500 mt-2">This match may have ended or the link is invalid.</p>
        <Button className="mt-6 rounded-2xl" onClick={() => router.push('/')}>Go Home</Button>
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
    if (ball.isWicket) return 'W';
    if (ball.extraType === 'wide') return `WD`;
    if (ball.extraType === 'noBall') return `NB`;
    if (ball.extraType === 'bye') return `${ball.runs}B`;
    if (ball.extraType === 'legBye') return `${ball.runs}LB`;
    return ball.runs.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-body">
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold text-sm leading-none">{battingTeam.name}</h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-primary uppercase font-black tracking-widest">LIVE VIEW</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] font-bold ${match.status === 'ongoing' ? 'text-red-600 border-red-200' : ''}`}>
          {match.status === 'ongoing' ? '🔴 LIVE' : 'MATCH OVER'}
        </Badge>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        <Card className="bg-white rounded-3xl overflow-hidden shadow-lg border-none ring-1 ring-gray-100">
          <div className="bg-primary text-white p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-widest">
                  {match.currentInnings === 1 ? '1st Innings' : '2nd Innings'}
                </Badge>
                <h3 className="text-xl font-black truncate max-w-[180px]">{battingTeam.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black tabular-nums">
                  {currentInnings.totalRuns}<span className="text-2xl opacity-60">/{currentInnings.totalWickets}</span>
                </div>
                <div className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">
                  Overs {Math.floor(currentInnings.totalBalls / 6)}.{currentInnings.totalBalls % 6} ({match.totalOvers})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">CRR</span>
                <span className="text-lg font-black">{crr.toFixed(2)}</span>
              </div>
              {match.currentInnings === 2 && (
                <>
                  <Separator orientation="vertical" className="h-8 bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">RRR</span>
                    <span className="text-lg font-black">{rrr.toFixed(2)}</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-none font-bold text-[10px] px-3 py-1">
                    TARGET {target}
                  </Badge>
                </>
              )}
            </div>

            {match.currentInnings === 2 && match.status === 'ongoing' && (
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center animate-pulse">
                <p className="text-sm font-black uppercase tracking-tight">
                  {runsNeeded <= 0 ? 'Target Reached!' : `Needs ${runsNeeded} runs from ${ballsRemaining} balls`}
                </p>
              </div>
            )}
          </div>
          
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              {[striker, nonStriker].map((p, idx) => (
                <div 
                  key={p?.id || idx} 
                  className={`flex justify-between items-center py-2 px-3 rounded-xl transition-colors ${idx === 0 ? 'bg-primary/5 border border-primary/10' : ''}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
                    <span className={`font-bold truncate ${idx === 0 ? 'text-primary' : 'text-gray-600'}`}>
                      {p?.name || '---'}
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black leading-none">{p?.runs || 0}<span className="text-xs font-bold text-gray-400 ml-1">({p?.balls || 0})</span></span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">SR {p && p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0"}</span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase leading-tight border-l pl-3 border-gray-100 min-w-[35px]">
                      4s: {p?.fours || 0}<br/>6s: {p?.sixes || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="bg-gray-100" />

            <div className={`bg-secondary/5 rounded-xl p-3 border border-secondary/10 flex justify-between items-center transition-colors`}>
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className={`w-2 h-2 rounded-full ${bowler ? 'bg-secondary' : 'bg-transparent'}`} />
                <span className="font-bold text-secondary truncate">{bowler?.name || '---'}</span>
              </div>
              <div className="text-right flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-lg font-black text-secondary leading-none">{bowler?.wickets || 0}<span className="text-xs font-bold text-gray-400 ml-1">-{bowler?.runsConceded || 0}</span></span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">Econ {(bowler && bowler.oversBowled > 0 ? (bowler.runsConceded / (Math.floor(bowler.oversBowled) + (bowler.oversBowled % 1) * 10 / 6)).toFixed(2) : "0.00")}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 border-l pl-3 border-gray-100 min-w-[40px]">
                  Overs<br/><span className="text-gray-900">{Math.floor(bowler?.oversBowled || 0)}.{Math.round(((bowler?.oversBowled || 0) % 1) * 10)}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-50" />

            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">THIS OVER</p>
               <div className="flex gap-2 flex-wrap">
                {lastBalls.length > 0 ? lastBalls.map((ball, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${ball.isWicket ? 'bg-red-500 text-white border-red-600' : 'bg-gray-100 text-gray-700'}`}>
                    {getBallDisplay(ball)}
                  </div>
                )) : (
                  <span className="text-xs text-gray-400 italic">No balls bowled yet</span>
                )}
               </div>
            </div>
          </CardContent>
        </Card>

        <BannerAd />

        <Tabs defaultValue="batting" className="w-full">
           <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 mb-4">
              <TabsTrigger value="batting" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">BATTING</TabsTrigger>
              <TabsTrigger value="bowling" className="rounded-lg font-bold uppercase text-[10px] tracking-widest">BOWLING</TabsTrigger>
           </TabsList>
           
           <TabsContent value="batting">
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold text-[10px] uppercase">Batsman</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">R</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">B</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">4/6</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">SR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {battingTeam.players.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">
                          <p className="font-bold">{p.name}</p>
                          {p.isOut && <p className="text-[9px] text-red-500 uppercase font-black">{p.howOut || "out"}</p>}
                        </TableCell>
                        <TableCell className="text-center font-black">{p.runs}</TableCell>
                        <TableCell className="text-center text-xs text-gray-500">{p.balls}</TableCell>
                        <TableCell className="text-center text-xs text-gray-400">{p.fours || 0}/{p.sixes || 0}</TableCell>
                        <TableCell className="text-center text-[10px] font-mono opacity-60">{p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
           </TabsContent>

           <TabsContent value="bowling">
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold text-[10px] uppercase">Bowler</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">O</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">M</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">R</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">W</TableHead>
                      <TableHead className="text-center font-bold text-[10px] uppercase">Econ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bowlingTeam.players.filter(p => p.oversBowled > 0).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-bold">{p.name}</TableCell>
                        <TableCell className="text-center text-xs">{Math.floor(p.oversBowled)}.{Math.round((p.oversBowled % 1) * 10)}</TableCell>
                        <TableCell className="text-center text-xs text-secondary font-bold">{p.maidens || 0}</TableCell>
                        <TableCell className="text-center text-xs">{p.runsConceded}</TableCell>
                        <TableCell className="text-center font-black text-primary">{p.wickets}</TableCell>
                        <TableCell className="text-center font-mono text-[10px]">{(p.runsConceded / (Math.floor(p.oversBowled) + (p.oversBowled % 1) * 10 / 6) || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
           </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t px-4 py-2 flex justify-around items-center safe-paddings shadow-lg">
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-1 text-[10px] font-black text-primary"
        >
          <Clock className="w-5 h-5" />
          LIVE SCORE
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-1 text-[10px] font-black text-gray-400"
          onClick={() => router.push('/')}
        >
          <LayoutGrid className="w-5 h-5" />
          ALL MATCHES
        </Button>
      </footer>
    </div>
  );
}
