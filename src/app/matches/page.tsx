"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  PlusCircle, 
  Layers, 
  Search,
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMatchStore, Match } from '@/lib/match-store';
import { format } from 'date-fns';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function MatchesPage() {
  const router = useRouter();
  const { matches } = useMatchStore();
  const [matchList, setMatchList] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setMatchList(matches || []);
    setIsLoading(false);
  }, [matches]);

  const filteredMatches = matchList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const teamA = m.teamA?.name?.toLowerCase() || '';
    const teamB = m.teamB?.name?.toLowerCase() || '';
    return teamA.includes(searchQuery.toLowerCase()) || teamB.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 max-w-lg mx-auto space-y-5 pb-24 select-none">
      
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="font-headline font-black text-xl uppercase tracking-tight flex items-center justify-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> MATCH HISTORY
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            Scored Matches & Live Games
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/matches/create')}
          className="rounded-full"
        >
          <PlusCircle className="w-5 h-5 text-primary" />
        </Button>
      </header>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search matches by team name..."
          className="h-11 pl-9 rounded-2xl border-border bg-muted/30 font-medium text-xs"
        />
      </div>

      {/* Match Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading matches...</p>
          </div>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((m) => {
            const matchDate = m.timestamp ? new Date(m.timestamp) : new Date();
            return (
              <Card
                key={m.id}
                onClick={() => router.push(`/matches/${m.id}/scorecard`)}
                className="bg-card border-border hover:border-primary/50 shadow-md rounded-3xl p-5 space-y-3 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" /> {format(matchDate, 'MMM dd, yyyy • h:mm a')}
                  </span>
                  <Badge
                    variant={m.status === 'ongoing' ? 'default' : 'outline'}
                    className={`text-[9px] font-black uppercase ${
                      m.status === 'ongoing' ? 'bg-destructive text-white animate-pulse' : ''
                    }`}
                  >
                    {m.status === 'ongoing' ? '🔴 LIVE' : 'COMPLETED'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="space-y-1">
                    <p className="font-headline font-black text-base uppercase tracking-tight">{m.teamA?.name}</p>
                    <p className="font-headline font-black text-base uppercase tracking-tight">{m.teamB?.name}</p>
                  </div>
                  <div className="text-right space-y-1 font-mono font-black text-sm text-primary">
                    <p>{m.innings1?.totalRuns || 0}/{m.innings1?.totalWickets || 0}</p>
                    <p>{m.innings2?.totalRuns || 0}/{m.innings2?.totalWickets || 0}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                  <span>{m.totalOvers} Overs Match</span>
                  <span className="text-primary flex items-center gap-1 font-black uppercase">
                    Scorecard <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="bg-card border-border rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-headline font-black text-base uppercase tracking-tight">No Matches Found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {searchQuery ? 'No match matches your search term.' : 'Start your first match to build your cricket history!'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/matches/create')}
              className="h-12 rounded-2xl px-6 font-black uppercase text-xs text-white shadow-md"
            >
              Start New Match
            </Button>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
