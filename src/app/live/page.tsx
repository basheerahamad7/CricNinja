"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Trophy, 
  Clock,
  LayoutGrid,
  Share2,
  Copy,
  Check,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMatchStore, Match, BallRecord } from '@/lib/match-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BannerAd } from '@/components/BannerAd';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { getCachedMatch } from '@/services/match-actions';

const POLLING_INTERVAL = 3000;

function LiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');
  
  const { joinedMatches, updateJoinedMatch, joinMatch } = useMatchStore();
  
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'uid' | 'link' | null>(null);
  const [origin, setOrigin] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const match = matchId ? joinedMatches[matchId] : null;

  const fetchScore = useCallback(async (showLoader = false) => {
    if (!matchId) return;
    if (showLoader) setIsRefreshing(true);
    
    try {
      const data = await getCachedMatch(matchId);
      if (data) {
        updateJoinedMatch(matchId, data);
      }
    } catch (e) {
      console.error("Failed to fetch score", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [matchId, updateJoinedMatch]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    const checkHydration = () => {
      if (useMatchStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };
    checkHydration();
    const unsub = useMatchStore.persist.onFinishHydration(checkHydration);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (matchId && isHydrated) {
      joinMatch(matchId);
      fetchScore(true);

      const interval = setInterval(() => {
        fetchScore();
      }, POLLING_INTERVAL);

      const handleFocus = () => {
        if (document.visibilityState === 'visible') {
          fetchScore(true);
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('visibilitychange', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('visibilitychange', handleFocus);
      };
    }
  }, [matchId, isHydrated, joinMatch, fetchScore]);

  if (!mounted || !isHydrated) return null;

  if (!match && isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-black text-xs text-gray-400 uppercase tracking-widest">Connecting to Live Feed...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Trophy className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Match Offline</h2>
        <p className="text-xs text-gray-400 font-bold mt-2 uppercase">Scoreboard unavailable or invalid ID.</p>
        <Button className="mt-8 rounded-2xl px-8 h-12 font-black uppercase tracking-widest shadow-lg" onClick={() => router.push('/')}>Return Home</Button>
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

  const copyToClipboard = (text: string, type: 'uid' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      toast({ title: "Copied!", description: `${type.toUpperCase()} saved to clipboard.` });
      setTimeout(() => setCopiedType(null), 2000);
    });
  };
  
  const handleShare = async () => {
    if (!match) return;
    const shareUrl = `${origin}/live?id=${match.id}`;
    const text = `🏏 LIVE Score: ${battingTeam.name} vs ${bowlingTeam.name} on CricNinja!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CricNinja Live', text, url: shareUrl });
      } else {
        setIsShareDialogOpen(true);
      }
    } catch (e) {
      setIsShareDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-body">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="truncate">
            <h2 className="font-black text-[10px] text-gray-400 uppercase leading-none mb-1">SPECTATING</h2>
            <h1 className="font-bold text-sm leading-none truncate">{battingTeam.name}</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {isRefreshing && <RefreshCcw className="w-3 h-3 text-primary animate-spin" />}
            <Badge variant="outline" className={`text-[9px] font-black uppercase ${match.status === 'ongoing' ? 'text-red-600 border-red-200' : 'text-gray-400 border-gray-200'}`}>
              {match.status === 'ongoing' ? '🔴 LIVE' : 'FINISHED'}
            </Badge>
          </div>
          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">Syncs every 3s</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        <Card className="bg-white rounded-[2rem] overflow-hidden shadow-xl border-none ring-1 ring-gray-100">
          <div className="bg-primary text-white p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-widest">
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
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-none font-black text-[10px] px-3 py-1">
                    TARGET {target}
                  </Badge>
                </>
              )}
            </div>
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
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${ball.isWicket ? 'bg-red-500 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                    {getBallDisplay(ball)}
                  </div>
                )) : (
                  <span className="text-xs text-gray-300 italic font-medium">Waiting for next ball...</span>
                )}
               </div>
            </div>
          </CardContent>
        </Card>

        <BannerAd />

        <Tabs defaultValue="batting" className="w-full">
           <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 rounded-2xl p-1 mb-4">
              <TabsTrigger value="batting" className="rounded-xl font-black uppercase text-[10px] tracking-widest">BATTING</TabsTrigger>
              <TabsTrigger value="bowling" className="rounded-xl font-black uppercase text-[10px] tracking-widest">BOWLING</TabsTrigger>
           </TabsList>
           
           <TabsContent value="batting">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-gray-100 bg-white">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent border-gray-50">
                      <TableHead className="font-black text-[9px] uppercase tracking-widest">Batsman</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase">R</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase">B</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase">SR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {battingTeam.players.map((p) => (
                      <TableRow key={p.id} className="border-gray-50 hover:bg-gray-50/30">
                        <TableCell className="py-3">
                          <p className={`font-bold text-xs ${p.id === match.currentStrikerId ? 'text-primary' : ''}`}>
                            {p.name} {p.id === match.currentStrikerId && ' *'}
                          </p>
                          {p.isOut && <p className="text-[8px] text-red-500 uppercase font-black tracking-tight">{p.howOut || "out"}</p>}
                        </TableCell>
                        <TableCell className="text-center font-black tabular-nums text-sm">{p.runs}</TableCell>
                        <TableCell className="text-center text-xs text-gray-400 tabular-nums">{p.balls}</TableCell>
                        <TableCell className="text-center text-[10px] font-mono text-gray-400">{p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "0.0"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
           </TabsContent>

           <TabsContent value="bowling">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden ring-1 ring-gray-100 bg-white">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent border-gray-50">
                      <TableHead className="font-black text-[9px] uppercase tracking-widest">Bowler</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase">O</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase">W</TableHead>
                      <TableHead className="text-center font-black text-[9px] uppercase">Econ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bowlingTeam.players.filter(p => p.oversBowled > 0 || p.id === match.currentBowlerId).map((p) => (
                      <TableRow key={p.id} className="border-gray-50 hover:bg-gray-50/30">
                        <TableCell className={`py-3 font-bold text-xs ${p.id === match.currentBowlerId ? 'text-secondary' : ''}`}>
                          {p.name} {p.id === match.currentBowlerId && ' ⏺'}
                        </TableCell>
                        <TableCell className="text-center text-xs tabular-nums">{Math.floor(p.oversBowled)}.{Math.round((p.oversBowled % 1) * 10)}</TableCell>
                        <TableCell className="text-center font-black text-sm text-primary tabular-nums">{p.wickets}</TableCell>
                        <TableCell className="text-center font-mono text-[10px] text-gray-400">{(p.runsConceded / (Math.floor(p.oversBowled) + (p.oversBowled % 1) * 10 / 6) || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
           </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t px-4 py-2 flex justify-around items-center safe-paddings shadow-lg z-50">
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-primary uppercase"
        >
          <Clock className="w-5 h-5" />
          LIVE VIEW
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-gray-300 uppercase"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
          SHARE
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-gray-300 uppercase"
          onClick={() => router.push('/')}
        >
          <LayoutGrid className="w-5 h-5" />
          HOME
        </Button>
      </footer>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-black uppercase tracking-tight">Share Live Score</DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500 px-4">
              Share this match with others. They can view the live score on the web or join in the app using the Match UID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Match UID</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-xs break-all select-all">
                  {match.id}
                </div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-auto" onClick={() => copyToClipboard(match.id, 'uid')}>
                  {copiedType === 'uid' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Separator className="bg-gray-100" />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spectator Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-[10px] break-all select-all text-primary">
                  {`${origin}/live?id=${match.id}`}
                </div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-auto" onClick={() => copyToClipboard(`${origin}/live?id=${match.id}`, 'link')}>
                  {copiedType === 'link' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsShareDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black uppercase tracking-widest text-[10px] text-gray-400">Loading...</div>}>
      <LiveContent />
    </Suspense>
  );
}
