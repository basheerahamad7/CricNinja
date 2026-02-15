"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Share2, 
  History,
  LayoutGrid,
  Trophy,
  Zap,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useMatchStore, ExtraType, WicketType, BallRecord, Match } from '@/lib/match-store';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';

function ScoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');
  
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const { matches, updateMatch, undoMatchAction } = useMatchStore();
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [isWicketTypeDialogOpen, setIsWicketTypeDialogOpen] = useState(false);
  const [isWicketDialogOpen, setIsWicketDialogOpen] = useState(false);
  const [isBowlerDialogOpen, setIsBowlerDialogOpen] = useState(false);
  const [isExtraDialogOpen, setIsExtraDialogOpen] = useState(false);
  const [isEndInningsDialogOpen, setIsEndInningsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [playerToRename, setPlayerToRename] = useState<{ team: 'A' | 'B', id: string, name: string } | null>(null);
  const [newName, setNewName] = useState('');
  
  const [selectedExtra, setSelectedExtra] = useState<ExtraType | null>(null);
  const [copiedType, setCopiedType] = useState<'uid' | 'link' | null>(null);
  const [origin, setOrigin] = useState('');

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

  const match = useMemo(() => {
    if (!mounted || !isHydrated || !matchId) return null;
    return matches.find(m => m.id === matchId);
  }, [matches, matchId, mounted, isHydrated]);

  useEffect(() => {
    if (match && !match.currentBowlerId && match.status === 'ongoing') {
      setIsBowlerDialogOpen(true);
    }
  }, [match]);

  const isOwner = useMemo(() => {
    if (!match) return false;
    return matches.some(m => m.id === match.id);
  }, [match, matches]);

  const syncToFirestore = (updatedMatch: Match) => {
    if (db && isOwner) {
      const matchRef = doc(db, 'matches', updatedMatch.id);
      const { history, ...sanitizedMatch } = JSON.parse(JSON.stringify(updatedMatch));
      setDocumentNonBlocking(matchRef, sanitizedMatch, { merge: true });
    }
  };

  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-black text-xs text-gray-400 uppercase tracking-widest">Warming Up...</p>
        </div>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Trophy className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 uppercase">Match Not Found</h2>
        <Button className="mt-6 rounded-2xl px-8 h-12 font-black uppercase tracking-widest" onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const currentInnings = match.currentInnings === 1 ? match.innings1 : match.innings2;
  const battingTeam = match.teamA.id === currentInnings.battingTeamId ? match.teamA : match.teamB;
  const bowlingTeam = match.teamA.id === currentInnings.battingTeamId ? match.teamB : match.teamA;

  const striker = battingTeam.players.find(p => p.id === match.currentStrikerId);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentNonStrikerId);
  const bowler = bowlingTeam.players.find(p => p.id === match.currentBowlerId);

  const crr = currentInnings.totalRuns > 0 && currentInnings.totalBalls > 0
    ? (currentInnings.totalRuns / (currentInnings.totalBalls / 6)) 
    : 0;

  const target = match.innings1.totalRuns + 1;
  const runsNeeded = target - currentInnings.totalRuns;
  const ballsRemaining = (match.totalOvers * 6) - currentInnings.totalBalls;
  const rrr = match.currentInnings === 2 && ballsRemaining > 0
    ? (runsNeeded / (ballsRemaining / 6))
    : 0;

  const handleAction = (runs: number, extraType?: ExtraType, wicketType?: WicketType) => {
    if (match.status === 'completed') return;
    if (!match.currentBowlerId) {
      setIsBowlerDialogOpen(true);
      return;
    }

    const newMatch: Match = JSON.parse(JSON.stringify(match));
    const innings = newMatch.currentInnings === 1 ? newMatch.innings1 : newMatch.innings2;
    const isWicket = !!wicketType;
    const penaltyValue = 1;

    const totalRunsForBall = runs + (extraType === 'wide' || extraType === 'noBall' ? penaltyValue : 0);
    innings.totalRuns += totalRunsForBall;

    const isLegalBall = !extraType || extraType === 'bye' || extraType === 'legBye';
    if (isLegalBall) innings.totalBalls += 1;
    if (isWicket) innings.totalWickets += 1;

    if (!innings.overs) innings.overs = [];
    let currentOver = innings.overs[innings.overs.length - 1];
    const legalInOver = currentOver ? currentOver.balls.filter(b => !b.extraType || b.extraType === 'bye' || b.extraType === 'legBye').length : 0;
    
    if (!currentOver || legalInOver >= 6) {
      currentOver = { bowlerId: match.currentBowlerId || '', balls: [] };
      innings.overs.push(currentOver);
    }

    currentOver.balls.push({
      runs,
      isExtra: !!extraType,
      extraType: extraType || undefined,
      isWicket,
      wicketType: wicketType || undefined,
      batsmanId: match.currentStrikerId || '',
      bowlerId: match.currentBowlerId || ''
    });

    const updatedBattingTeam = newMatch.teamA.id === innings.battingTeamId ? newMatch.teamA : newMatch.teamB;
    const updatedBowlingTeam = newMatch.teamA.id === innings.battingTeamId ? newMatch.teamB : newMatch.teamA;
    const strikerPlayer = updatedBattingTeam.players.find((p) => p.id === newMatch.currentStrikerId);
    const currentBowler = updatedBowlingTeam.players.find((p) => p.id === newMatch.currentBowlerId);

    if (strikerPlayer) {
      if (!extraType || extraType === 'noBall') {
        strikerPlayer.runs += runs;
        if (runs === 4) strikerPlayer.fours = (strikerPlayer.fours || 0) + 1;
        if (runs === 6) strikerPlayer.sixes = (strikerPlayer.sixes || 0) + 1;
      }
      if (extraType !== 'wide') strikerPlayer.balls = (strikerPlayer.balls || 0) + 1;
      if (isWicket) {
        strikerPlayer.isOut = true;
        strikerPlayer.howOut = wicketType;
      }
    }

    if (currentBowler) {
      const bowlerRuns = (extraType === 'bye' || extraType === 'legBye') ? 0 : totalRunsForBall;
      currentBowler.runsConceded = (currentBowler.runsConceded || 0) + bowlerRuns;
      if (isWicket && !['runOut'].includes(wicketType!)) currentBowler.wickets = (currentBowler.wickets || 0) + 1;
      if (isLegalBall) {
        const totalBalls = Math.floor(currentBowler.oversBowled || 0) * 6 + Math.round(((currentBowler.oversBowled || 0) % 1) * 10) + 1;
        currentBowler.oversBowled = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
      }
    }

    if (runs % 2 !== 0) {
      const temp = newMatch.currentStrikerId;
      newMatch.currentStrikerId = newMatch.currentNonStrikerId;
      newMatch.currentNonStrikerId = temp;
    }

    const updatedLegal = currentOver.balls.filter(b => !b.extraType || b.extraType === 'bye' || b.extraType === 'legBye').length;
    const isOverEnd = (updatedLegal >= 6);

    const checkTargetReached = newMatch.currentInnings === 2 && innings.totalRuns >= target;
    const isAllOut = innings.totalWickets >= (updatedBattingTeam.players.length - 1);
    const isInningsOver = isAllOut || innings.totalBalls >= newMatch.totalOvers * 6 || checkTargetReached;
    
    if (isInningsOver) {
      if (newMatch.currentInnings === 2 || checkTargetReached) newMatch.status = 'completed';
      setIsEndInningsDialogOpen(true);
    } else if (isOverEnd) {
      const temp = newMatch.currentStrikerId;
      newMatch.currentStrikerId = newMatch.currentNonStrikerId;
      newMatch.currentNonStrikerId = temp;
      newMatch.currentBowlerId = null;
      setIsBowlerDialogOpen(true); 
    } else if (isWicket) {
      setIsWicketDialogOpen(true);
    }

    updateMatch(newMatch);
    syncToFirestore(newMatch);
    setIsExtraDialogOpen(false);
    setSelectedExtra(null);
    setIsWicketTypeDialogOpen(false);
  };

  const handleSelectBowler = (bowlerId: string) => {
    const newMatch: Match = JSON.parse(JSON.stringify(match));
    newMatch.currentBowlerId = bowlerId;
    updateMatch(newMatch, false);
    syncToFirestore(newMatch);
    setIsBowlerDialogOpen(false);
  };

  const handleRenamePlayer = () => {
    if (!playerToRename || !match || !newName.trim()) return;
    const newMatch = JSON.parse(JSON.stringify(match));
    const targetTeam = playerToRename.team === 'A' ? newMatch.teamA : newMatch.teamB;
    const player = targetTeam.players.find((p: any) => p.id === playerToRename.id);
    if (player) {
      player.name = newName.trim();
      updateMatch(newMatch);
      syncToFirestore(newMatch);
      toast({ title: "Player Renamed" });
    }
    setIsRenameDialogOpen(false);
    setPlayerToRename(null);
    setNewName('');
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
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}><ArrowLeft className="w-5 h-5" /></Button>
          <h2 className="font-black text-xs uppercase truncate max-w-[120px]">{battingTeam.name}</h2>
        </div>
        <Badge variant="outline" className={`text-[10px] font-black uppercase ${match.status === 'ongoing' ? 'text-red-600 border-red-200' : ''}`}>
          {match.status === 'ongoing' ? '🔴 LIVE' : 'FINISHED'}
        </Badge>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        <Card className="bg-white rounded-3xl overflow-hidden shadow-lg border-none ring-1 ring-gray-100">
          <div className="bg-primary text-white p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Innings {match.currentInnings}</p>
                <h3 className="text-2xl font-black truncate max-w-[150px]">{battingTeam.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black tabular-nums">{currentInnings.totalRuns}<span className="text-3xl opacity-60">/{currentInnings.totalWickets}</span></div>
                <div className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">
                  {Math.floor(currentInnings.totalBalls / 6)}.{currentInnings.totalBalls % 6} ({match.totalOvers})
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
          </div>
          
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              {[striker, nonStriker].map((p, idx) => (
                <div 
                  key={p?.id || idx} 
                  className={`flex justify-between items-center py-2 px-3 rounded-xl transition-colors ${idx === 0 ? 'bg-primary/5 border border-primary/10' : ''}`}
                  onDoubleClick={() => {
                    if (isOwner && p) {
                      setPlayerToRename({ team: match.currentInnings === 1 ? 'A' : 'B', id: p.id, name: p.name });
                      setNewName(p.name);
                      setIsRenameDialogOpen(true);
                    }
                  }}
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

            <div 
              className={`bg-secondary/5 rounded-xl p-3 border border-secondary/10 flex justify-between items-center transition-colors`}
              onDoubleClick={() => {
                if (isOwner && bowler) {
                  setPlayerToRename({ team: match.currentInnings === 1 ? 'B' : 'A', id: bowler.id, name: bowler.name });
                  setNewName(bowler.name);
                  setIsRenameDialogOpen(true);
                }
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className={`w-2 h-2 rounded-full ${bowler ? 'bg-secondary' : 'bg-transparent'}`} />
                <span className="font-bold text-secondary truncate">{bowler?.name || 'SELECT BOWLER'}</span>
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
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <Button key={run} variant="outline" className="h-14 text-xl font-black rounded-2xl bg-white shadow-sm border-none ring-1 ring-gray-100" onClick={() => handleAction(run)}>{run}</Button>
          ))}
          <Button variant="outline" className="h-14 text-[10px] font-black rounded-2xl bg-amber-50 text-amber-600 border-none ring-1 ring-amber-100" onClick={() => handleAction(0, 'wide')}>WIDE</Button>
          <Button variant="outline" className="h-14 text-[10px] font-black rounded-2xl bg-amber-50 text-amber-600 border-none ring-1 ring-amber-100" onClick={() => { setSelectedExtra('noBall'); setIsExtraDialogOpen(true); }}>NO BALL</Button>
          <Button variant="outline" className="h-14 text-[10px] font-black rounded-2xl bg-gray-100 text-gray-600 border-none ring-1 ring-gray-200" onClick={() => { setSelectedExtra('legBye'); setIsExtraDialogOpen(true); }}>L.BYE</Button>
          <Button variant="outline" className="h-14 text-[10px] font-black rounded-2xl bg-gray-100 text-gray-600 border-none ring-1 ring-gray-200" onClick={() => { setSelectedExtra('bye'); setIsExtraDialogOpen(true); }}>BYE</Button>
          <Button variant="outline" className="h-14 text-[10px] font-black rounded-2xl bg-blue-50 text-blue-600 border-none ring-1 ring-blue-100" onClick={() => undoMatchAction(match.id)}>UNDO</Button>
          <Button variant="outline" className="h-14 text-[10px] font-black rounded-2xl bg-red-600 text-white border-none shadow-md hover:bg-red-700" onClick={() => setIsWicketTypeDialogOpen(true)}>OUT!</Button>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-white border-t px-4 py-2 flex justify-around items-center safe-paddings shadow-2xl z-50">
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-primary uppercase"><Zap className="w-5 h-5" /> SCORING</Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-gray-400 uppercase" onClick={() => router.push(`/matches/overs?id=${matchId}`)}><History className="w-5 h-5" /> TIMELINE</Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-gray-400 uppercase" onClick={() => router.push(`/matches/scorecard?id=${matchId}`)}><LayoutGrid className="w-5 h-5" /> FULL CARD</Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1 text-[9px] font-black text-gray-400 uppercase" onClick={handleShare}><Share2 className="w-5 h-5" /> SHARE</Button>
      </footer>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw]">
          <DialogHeader><DialogTitle className="text-center font-black uppercase">Rename Player</DialogTitle></DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter name" className="h-12 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
          <DialogFooter><Button className="w-full h-12 rounded-2xl font-black uppercase" onClick={handleRenamePlayer}>Update Name</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-black uppercase tracking-tight">Share Match</DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500 px-4">
              Share this match with others. They can view the live score on the web or join as a scorer in the app using the Match UID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Match UID (Join via App)</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-xs break-all select-all">{match.id}</div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-auto" onClick={() => { navigator.clipboard.writeText(match.id); setCopiedType('uid'); setTimeout(() => setCopiedType(null), 2000); }}>
                  {copiedType === 'uid' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Separator className="bg-gray-100" />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Web Spectator Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-[10px] break-all select-all text-primary">{`${origin}/live?id=${match.id}`}</div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-auto" onClick={() => { navigator.clipboard.writeText(`${origin}/live?id=${match.id}`); setCopiedType('link'); setTimeout(() => setCopiedType(null), 2000); }}>
                  {copiedType === 'link' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter><Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsShareDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBowlerDialogOpen} onOpenChange={setIsBowlerDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw]">
          <DialogHeader><DialogTitle className="text-center uppercase font-black tracking-tighter">{!match.currentBowlerId ? 'Select Opening Bowler' : 'Select Next Bowler'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4 max-h-[60vh] overflow-y-auto">
            {bowlingTeam.players.map((p) => (
              <Button 
                key={p.id} 
                variant="outline" 
                className={`h-14 rounded-2xl font-black flex justify-between px-4 ${p.id === match.currentBowlerId ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => handleSelectBowler(p.id)}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 opacity-40" />
                  <span>{p.name}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">{p.wickets}-{p.runsConceded}</Badge>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExtraDialogOpen} onOpenChange={setIsExtraDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw]">
          <DialogHeader><DialogTitle className="text-center font-black uppercase">Select Extra Run</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <Button key={r} variant="outline" className="h-16 rounded-2xl font-black text-2xl" onClick={() => handleAction(r, selectedExtra!)}>{r}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isWicketTypeDialogOpen} onOpenChange={setIsWicketTypeDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[95vw] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0"><DialogTitle className="text-center font-black uppercase">Wicket Method</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 p-6 bg-white">
            {['bowled', 'caught', 'lbw', 'runOut', 'stumped', 'retired'].map((w) => (
              <Button key={w} variant="outline" className="h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => handleAction(0, undefined, w as WicketType)}>{w}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEndInningsDialogOpen} onOpenChange={setIsEndInningsDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw] text-center p-8">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <DialogHeader><DialogTitle className="text-center uppercase font-black">{match.status === 'completed' ? 'Match Over!' : 'Innings Over!'}</DialogTitle></DialogHeader>
          <DialogFooter className="flex-col gap-2">
            {match.currentInnings === 1 ? (
              <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest" onClick={() => { const nm = JSON.parse(JSON.stringify(match)); nm.currentInnings = 2; nm.currentStrikerId = nm.teamB.players[0].id; nm.currentNonStrikerId = nm.teamB.players[1].id; nm.currentBowlerId = null; updateMatch(nm); syncToFirestore(nm); setIsEndInningsDialogOpen(false); }}>Start Run Chase</Button>
            ) : (
              <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest" onClick={() => router.push(`/matches/scorecard?id=${matchId}`)}>View Results</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black uppercase tracking-widest">Loading...</div>}>
      <ScoringContent />
    </Suspense>
  );
}