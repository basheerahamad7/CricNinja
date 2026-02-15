"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Printer, PlusCircle, Home, Star, User, UserPlus, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useMatchStore, Player, Team, Match } from '@/lib/match-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';

function ScorecardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('id');
  const { matches, updateMatch } = useMatchStore();
  const { user } = useUser();
  const { firestore: db } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [playerToRename, setPlayerToRename] = useState<{ team: 'A' | 'B', id: string, name: string } | null>(null);
  const [newName, setNewName] = useState('');

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'uid' | 'link' | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => { 
    setMounted(true);
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    const checkHydration = () => {
      if (useMatchStore.persist.hasHydrated()) setIsHydrated(true);
    };
    checkHydration();
    const unsub = useMatchStore.persist.onFinishHydration(checkHydration);
    return () => unsub();
  }, []);

  const match = useMemo(() => {
    if (!isHydrated || !matchId) return null;
    return matches.find(m => m.id === matchId);
  }, [matches, matchId, isHydrated]);

  const isOwner = useMemo(() => {
    if (!match || !user) return matches.some(m => m.id === match?.id);
    return match.ownerId === user.uid || matches.some(m => m.id === match.id);
  }, [match, matches, user]);

  const { winner, mvp } = useMemo((): { winner: { name: string; margin: string } | null; mvp: Player | null } => {
    if (!match) return { winner: null, mvp: null };
    const r1 = match.innings1.totalRuns;
    const r2 = match.innings2.totalRuns;
    const t1 = match.teamA.id === match.innings1.battingTeamId ? match.teamA : match.teamB;
    const t2 = match.teamA.id === match.innings2.battingTeamId ? match.teamA : match.teamB;
    let winTeam: Team | null = null;
    let winData: { name: string; margin: string } | null = null;

    if (match.status === 'completed') {
      if (r1 > r2) { winTeam = t1; winData = { name: t1.name, margin: `${r1 - r2} runs` }; }
      else if (r2 > r1) { winTeam = t2; winData = { name: t2.name, margin: `${t2.players.length - 1 - match.innings2.totalWickets} wickets` }; }
      else winData = { name: "Match Tied", margin: "" };
    }

    let bestP: Player | null = null;
    if (winTeam) {
      let maxS = -1;
      winTeam.players.forEach(p => {
        const s = (p.runs || 0) + ((p.wickets || 0) * 20);
        if (s > maxS) { maxS = s; bestP = p; }
      });
    }
    return { winner: winData, mvp: bestP };
  }, [match]);

  const syncToFirestore = (updatedMatch: Match) => {
    if (db && isOwner) {
      const matchRef = doc(db, 'matches', updatedMatch.id);
      const { history, ...sanitizedMatch } = JSON.parse(JSON.stringify(updatedMatch));
      setDocumentNonBlocking(matchRef, sanitizedMatch, { merge: true });
    }
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

  const handleAddPlayer = (teamId: string) => {
    if (!match) return;
    const newMatch = JSON.parse(JSON.stringify(match));
    const targetTeam = newMatch.teamA.id === teamId ? newMatch.teamA : newMatch.teamB;
    
    const newPlayer: Player = {
      id: uuidv4(),
      name: `${targetTeam.name} Player ${targetTeam.players.length + 1}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      oversBowled: 0,
      runsConceded: 0,
      isOut: false,
      dotsFace: 0,
      maidens: 0,
      dotsBowled: 0,
      widesConceded: 0,
      noBallsConceded: 0,
    };

    targetTeam.players.push(newPlayer);
    updateMatch(newMatch);
    syncToFirestore(newMatch);
    toast({ title: "Player Added", description: `Added to ${targetTeam.name}` });
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
    const text = `🏏 Match Result: ${match.teamA.name} vs ${match.teamB.name} on CricNinja!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CricNinja Scorecard', text, url: shareUrl });
      } else {
        setIsShareDialogOpen(true);
      }
    } catch (e) {
      setIsShareDialogOpen(true);
    }
  };

  if (!mounted || !isHydrated) return null;

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-black uppercase">Scorecard Unavailable</h2>
        <Button className="mt-6 rounded-2xl px-8 h-12 font-black uppercase tracking-widest" onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const innings1Team = match.teamA.id === match.innings1.battingTeamId ? match.teamA : match.teamB;
  const innings1BowlingTeam = match.teamA.id === match.innings1.battingTeamId ? match.teamB : match.teamA;
  const innings2Team = match.teamA.id === match.innings2.battingTeamId ? match.teamA : match.teamB;
  const innings2BowlingTeam = match.teamA.id === match.innings2.battingTeamId ? match.teamB : match.teamA;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-body">
      <header className="bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/matches/scoring?id=${matchId}`)} className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold uppercase tracking-tight">Match Result</h1>
        </div>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-white">
                <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()} className="text-white">
                <Printer className="h-5 w-5" />
            </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] text-center p-8 bg-white ring-1 ring-gray-100">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-black uppercase mb-4">{match.teamA.name} vs {match.teamB.name}</CardTitle>
          
          {winner && (
            <div className="mt-2 space-y-2">
              <p className="text-primary font-black text-3xl uppercase">{winner.name} WON!</p>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">BY {winner.margin}</p>
            </div>
          )}

          {mvp && (
            <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Match MVP</span>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-black text-lg">{mvp.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    {mvp.runs} runs • {mvp.wickets} wickets
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-8">
            <Button variant="outline" className="rounded-2xl h-12 font-black uppercase text-[10px]" onClick={() => router.push('/matches/create')}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Match
            </Button>
            <Button variant="outline" className="rounded-2xl h-12 font-black uppercase text-[10px]" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            {isOwner && (
              <>
                <Button variant="secondary" className="rounded-2xl h-12 font-black uppercase text-[10px] bg-primary/5 text-primary border-none" onClick={() => handleAddPlayer(match.teamA.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add {match.teamA.name}
                </Button>
                <Button variant="secondary" className="rounded-2xl h-12 font-black uppercase text-[10px] bg-secondary/5 text-secondary border-none" onClick={() => handleAddPlayer(match.teamB.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add {match.teamB.name}
                </Button>
              </>
            )}
          </div>
        </Card>

        <Tabs defaultValue="innings1" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200/50 rounded-2xl p-1 mb-6">
            <TabsTrigger value="innings1" className="font-black text-[10px] tracking-widest">{innings1Team.name}</TabsTrigger>
            <TabsTrigger value="innings2" className="font-black text-[10px] tracking-widest">{innings2Team.name}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="innings1" className="space-y-6">
            <InningsSection 
              battingTeam={innings1Team} 
              bowlingTeam={innings1BowlingTeam} 
              runs={match.innings1.totalRuns} 
              wickets={match.innings1.totalWickets} 
              balls={match.innings1.totalBalls} 
              isOwner={isOwner}
              onRename={(id: string, name: string) => {
                setPlayerToRename({ team: match.teamA.id === innings1Team.id ? 'A' : 'B', id, name });
                setNewName(name);
                setIsRenameDialogOpen(true);
              }}
              onAddPlayer={() => handleAddPlayer(innings1Team.id)}
            />
          </TabsContent>
          <TabsContent value="innings2" className="space-y-6">
            <InningsSection 
              battingTeam={innings2Team} 
              bowlingTeam={innings2BowlingTeam} 
              runs={match.innings2.totalRuns} 
              wickets={match.innings2.totalWickets} 
              balls={match.innings2.totalBalls} 
              isOwner={isOwner}
              onRename={(id: string, name: string) => {
                setPlayerToRename({ team: match.teamA.id === innings2Team.id ? 'A' : 'B', id, name });
                setNewName(name);
                setIsRenameDialogOpen(true);
              }}
              onAddPlayer={() => handleAddPlayer(innings2Team.id)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-center font-black uppercase tracking-tighter">Rename Player</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Player Name</label>
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                className="h-12 w-full rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest" onClick={handleRenamePlayer}>
              Update Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[90vw] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-black uppercase tracking-tight">Share Scorecard</DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500 px-4">
              Share this scorecard with others. They can view it on the web or join the match in the app using the Match UID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Match UID (For App)</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-xs break-all select-all">{match.id}</div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-auto" onClick={() => copyToClipboard(match.id, 'uid')}>{copiedType === 'uid' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</Button>
              </div>
            </div>
            <Separator className="bg-gray-100" />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Scorecard Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-[10px] break-all select-all text-primary">{`${origin}/live?id=${match.id}`}</div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-auto" onClick={() => copyToClipboard(`${origin}/live?id=${match.id}`, 'link')}>{copiedType === 'link' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</Button>
              </div>
            </div>
          </div>
          <DialogFooter><Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsShareDialogOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InningsSection({ battingTeam, bowlingTeam, runs, wickets, balls, isOwner, onRename, onAddPlayer }: any) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-[2rem] border-none shadow-lg ring-1 ring-gray-100 bg-white">
        <div className="bg-primary text-white p-6 flex justify-between items-end">
          <div>
            <span className="font-black uppercase text-[10px] opacity-70 block mb-1">Innings Total</span>
            <span className="text-4xl font-black">{runs}<span className="text-xl opacity-60 ml-1">/{wickets}</span></span>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div className="text-xs font-bold opacity-80 uppercase">
              {Math.floor(balls/6)}.{balls%6} Overs
            </div>
            {isOwner && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-7 px-2 text-[10px] font-black uppercase gap-1 rounded-lg bg-white/20 hover:bg-white/30 text-white border-none"
                onClick={onAddPlayer}
              >
                <UserPlus className="w-3 h-3" /> Add Player
              </Button>
            )}
          </div>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-black uppercase text-[10px]">Batter</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">R</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">B</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">4s/6s</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">SR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {battingTeam.players.map((p: Player) => (
              <TableRow key={p.id}>
                <TableCell className="py-4">
                  <p 
                    className={`font-bold text-sm ${isOwner ? 'cursor-pointer hover:text-primary transition-colors underline decoration-dotted' : ''}`}
                    onDoubleClick={() => isOwner && onRename(p.id, p.name)}
                  >
                    {p.name}
                  </p>
                  {p.isOut && <p className="text-[9px] text-red-500 uppercase font-black">{p.howOut || 'out'}</p>}
                </TableCell>
                <TableCell className="text-center font-black text-base">{p.runs}</TableCell>
                <TableCell className="text-center text-gray-400 text-xs font-bold">{p.balls}</TableCell>
                <TableCell className="text-center text-gray-400 text-[10px]">{p.fours || 0}/{p.sixes || 0}</TableCell>
                <TableCell className="text-center font-mono text-[10px]">{p.balls > 0 ? ((p.runs/p.balls)*100).toFixed(1) : "0.0"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-none shadow-md ring-1 ring-gray-100 bg-white">
        <Table>
          <TableHeader className="bg-secondary/5">
            <TableRow>
              <TableHead className="font-black uppercase text-[10px] text-secondary">Bowler</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] text-secondary">O</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] text-secondary">M</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] text-secondary">R</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] text-secondary">W</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] text-secondary">Econ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bowlingTeam.players.filter((p: Player) => p.oversBowled > 0).map((p: Player) => (
              <TableRow key={p.id}>
                <TableCell className="py-3">
                  <p 
                    className={`font-bold text-xs ${isOwner ? 'cursor-pointer hover:text-secondary transition-colors underline decoration-dotted' : ''}`}
                    onDoubleClick={() => isOwner && onRename(p.id, p.name)}
                  >
                    {p.name}
                  </p>
                </TableCell>
                <TableCell className="text-center text-xs">{Math.floor(p.oversBowled)}.{Math.round((p.oversBowled % 1) * 10)}</TableCell>
                <TableCell className="text-center text-xs font-bold text-secondary">{p.maidens || 0}</TableCell>
                <TableCell className="text-center text-xs">{p.runsConceded}</TableCell>
                <TableCell className="text-center font-black text-sm text-primary">{p.wickets}</TableCell>
                <TableCell className="text-center font-mono text-[10px]">{(p.runsConceded / (Math.floor(p.oversBowled) + (p.oversBowled % 1) * 10 / 6) || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function ScorecardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black uppercase tracking-widest text-[10px] text-gray-400">Loading Scorecard...</div>}>
      <ScorecardContent />
    </Suspense>
  );
}