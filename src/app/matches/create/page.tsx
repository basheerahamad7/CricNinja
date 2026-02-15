"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, UserPlus, Trash2, Trophy, Settings2, MapPin, Users, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMatchStore, Player, Match } from '@/lib/match-store';
import { useUser, useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function CreateMatchPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { addMatch } = useMatchStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      signInAnonymously(auth).catch(() => {});
    }
  }, [user, isUserLoading, auth, mounted]);

  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [overs, setOvers] = useState(20);
  const [venue, setVenue] = useState('');
  const [series, setSeries] = useState('');
  const [umpires, setUmpires] = useState('');

  const createPlayer = (name: string): Player => ({
    id: uuidv4(),
    name,
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
  });

  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (mounted) {
      setTeamAPlayers([
        createPlayer('A Player 1'),
        createPlayer('A Player 2'),
      ]);
      setTeamBPlayers([
        createPlayer('B Player 1'),
        createPlayer('B Player 2'),
      ]);
    }
  }, [mounted]);

  if (!mounted) return null;

  const addPlayer = (team: 'A' | 'B') => {
    const name = team === 'A' ? `A Player ${teamAPlayers.length + 1}` : `B Player ${teamBPlayers.length + 1}`;
    const newPlayer = createPlayer(name);
    if (team === 'A') setTeamAPlayers([...teamAPlayers, newPlayer]);
    else setTeamBPlayers([...teamBPlayers, newPlayer]);
  };

  const removePlayer = (team: 'A' | 'B', id: string) => {
    if (team === 'A') {
      if (teamAPlayers.length <= 2) return;
      setTeamAPlayers(teamAPlayers.filter(p => p.id !== id));
    } else {
      if (teamBPlayers.length <= 2) return;
      setTeamBPlayers(teamBPlayers.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (team: 'A' | 'B', id: string, name: string) => {
    if (team === 'A') {
      setTeamAPlayers(teamAPlayers.map(p => p.id === id ? { ...p, name } : p));
    } else {
      setTeamBPlayers(teamBPlayers.map(p => p.id === id ? { ...p, name } : p));
    }
  };

  const handleStartMatch = () => {
    const teamAId = uuidv4();
    const teamBId = uuidv4();

    const newMatch: Match = {
      id: uuidv4(),
      ownerId: user?.uid || undefined,
      teamA: { id: teamAId, name: teamAName, players: teamAPlayers },
      teamB: { id: teamBId, name: teamBName, players: teamBPlayers },
      totalOvers: overs,
      venue,
      series,
      umpires: umpires.split(',').map(u => u.trim()).filter(u => u.length > 0),
      currentInnings: 1,
      status: 'ongoing',
      innings1: {
        battingTeamId: teamAId,
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
        overs: [],
      },
      innings2: {
        battingTeamId: teamBId,
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
        overs: [],
      },
      currentStrikerId: teamAPlayers[0].id,
      currentNonStrikerId: teamAPlayers[1].id,
      currentBowlerId: null,
      timestamp: Date.now(),
    };

    addMatch(newMatch);
    router.push(`/matches/scoring?id=${newMatch.id}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-body">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-headline font-black uppercase tracking-tight">Configure Match</h1>
        </div>

        <section className="grid md:grid-cols-2 gap-8">
          <Card className="md:col-span-2 shadow-sm border-none bg-white rounded-3xl overflow-hidden ring-1 ring-gray-100">
            <CardHeader className="flex flex-row items-center gap-2 border-b bg-gray-50/50">
              <Settings2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Match Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Overs per Innings</Label>
                  <Input 
                    type="number" 
                    value={overs} 
                    onChange={(e) => setOvers(Number(e.target.value))}
                    className="text-lg font-black bg-gray-50 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Series Name</Label>
                  <Input 
                    value={series} 
                    placeholder="Enter Series Name"
                    onChange={(e) => setSeries(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Venue / Stadium</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      value={venue} 
                      placeholder="Enter Venue"
                      onChange={(e) => setVenue(e.target.value)}
                      className="pl-10 bg-gray-50 border-none rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Umpires (comma separated)</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      value={umpires} 
                      placeholder="e.g. John Doe, Jane Smith"
                      onChange={(e) => setUmpires(e.target.value)}
                      className="pl-10 bg-gray-50 border-none rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <TeamConfig 
            title="Team A (Batting First)"
            teamName={teamAName}
            setTeamName={setTeamAName}
            players={teamAPlayers}
            addPlayer={() => addPlayer('A')}
            removePlayer={(id: string) => removePlayer('A', id)}
            updatePlayerName={(id: string, name: string) => updatePlayerName('A', id, name)}
            color="primary"
          />

          <TeamConfig 
            title="Team B (Bowling First)"
            teamName={teamBName}
            setTeamName={setTeamBName}
            players={teamBPlayers}
            addPlayer={() => addPlayer('B')}
            removePlayer={(id: string) => removePlayer('B', id)}
            updatePlayerName={(id: string, name: string) => updatePlayerName('B', id, name)}
            color="secondary"
          />
        </section>

        <div className="flex justify-center pt-8">
          <Button 
            size="lg" 
            className="w-full md:w-64 h-16 text-xl font-black rounded-3xl shadow-xl shadow-primary/20 uppercase tracking-widest"
            onClick={handleStartMatch}
          >
            Start Match
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeamConfig({ title, teamName, setTeamName, players, addPlayer, removePlayer, updatePlayerName, color }: any) {
  const colorClass = color === 'primary' ? 'text-primary' : 'text-secondary';
  const bgColorClass = color === 'primary' ? 'bg-primary/5' : 'bg-secondary/5';
  const borderColorClass = color === 'primary' ? 'border-primary/10' : 'border-secondary/10';

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl overflow-hidden ring-1 ring-gray-100">
      <CardHeader className={`${bgColorClass} border-b ${borderColorClass}`}>
        <div className="flex justify-between items-center">
          <CardTitle className={`${colorClass} font-black text-xs uppercase tracking-widest`}>{title}</CardTitle>
          <Trophy className={`w-4 h-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400">Team Name</Label>
          <div className="relative">
            <Edit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              value={teamName} 
              onChange={(e) => setTeamName(e.target.value)}
              className="font-black border-none bg-gray-50 rounded-xl pl-10"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] font-black uppercase text-gray-400">Squad ({players.length})</Label>
            <Button variant="ghost" size="sm" onClick={addPlayer} className={`h-7 px-2 gap-1 text-[10px] font-black uppercase ${colorClass}`}>
              <UserPlus className="w-3 h-3" /> Add Player
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {players.map((player: any) => (
              <div key={player.id} className="flex gap-2 group">
                <div className="relative flex-1">
                  <Edit2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Input 
                    value={player.name} 
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    className="bg-gray-50/50 border-none h-10 text-sm font-bold rounded-xl pr-10 pl-8"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  onClick={() => removePlayer(player.id)}
                  disabled={players.length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
