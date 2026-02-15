
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Printer, PlusCircle, Home, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useMatchStore, Player, Team } from '@/lib/match-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ScorecardClient() {
  const { id } = useParams();
  const router = useRouter();
  const { matches } = useMatchStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const matchId = Array.isArray(id) ? id[0] : id;
  const match = matches.find(m => m.id === matchId);

  const { winner, mvp } = useMemo(() => {
    if (!match) return { winner: null, mvp: null };
    const r1 = match.innings1.totalRuns;
    const r2 = match.innings2.totalRuns;
    const t1 = match.teamA.id === match.innings1.battingTeamId ? match.teamA : match.teamB;
    const t2 = match.teamA.id === match.innings2.battingTeamId ? match.teamA : match.teamB;
    let winTeam: Team | null = null;
    let winData = null;

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

  if (!mounted || !match) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-body">
      <header className="bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/matches/${matchId}`)} className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Match Result</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.print()} className="text-white">
          <Printer className="h-5 w-5" />
        </Button>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] text-center p-8 bg-white ring-1 ring-gray-100">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-black uppercase">{match.teamA.name} vs {match.teamB.name}</CardTitle>
          
          {winner && (
            <div className="mt-6 space-y-2">
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
          </div>
        </Card>

        <Tabs defaultValue="innings1" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-200/50 rounded-2xl p-1 mb-6">
            <TabsTrigger value="innings1" className="font-black text-[10px] tracking-widest">{match.teamA.name}</TabsTrigger>
            <TabsTrigger value="innings2" className="font-black text-[10px] tracking-widest">{match.teamB.name}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="innings1">
            <ScoreTable players={match.teamA.players} runs={match.innings1.totalRuns} wickets={match.innings1.totalWickets} overs={match.innings1.totalBalls} />
          </TabsContent>
          <TabsContent value="innings2">
            <ScoreTable players={match.teamB.players} runs={match.innings2.totalRuns} wickets={match.innings2.totalWickets} overs={match.innings2.totalBalls} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ScoreTable({ players, runs, wickets, overs }: any) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-none shadow-lg ring-1 ring-gray-100 bg-white">
      <div className="bg-primary text-white p-6 flex justify-between items-end">
        <div>
          <span className="font-black uppercase text-[10px] opacity-70 block mb-1">Innings Total</span>
          <span className="text-4xl font-black">{runs}<span className="text-xl opacity-60 ml-1">/{wickets}</span></span>
        </div>
        <div className="text-right text-xs font-bold opacity-80 uppercase">
          {Math.floor(overs/6)}.{overs%6} Overs
        </div>
      </div>
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-black uppercase text-[10px]">Batter</TableHead>
            <TableHead className="text-center font-black uppercase text-[10px]">R</TableHead>
            <TableHead className="text-center font-black uppercase text-[10px]">B</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="py-4 font-bold text-sm">{p.name}</TableCell>
              <TableCell className="text-center font-black text-base">{p.runs}</TableCell>
              <TableCell className="text-center text-gray-400 text-xs font-bold">{p.balls}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
