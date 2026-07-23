"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  MapPin, 
  Trophy, 
  Target, 
  Zap, 
  CheckCircle2, 
  Edit3, 
  LogOut, 
  ArrowLeft,
  Award,
  Star,
  Activity,
  PieChart,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModeToggle } from '@/components/mode-toggle';
import { toast } from '@/hooks/use-toast';
import { BottomNavigation } from '../../components/BottomNavigation';

export default function ProfilePage() {
  const router = useRouter();
  const { auth } = useFirebase();
  const { user, userProfile } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'rankings' | 'matches'>('overview');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Signed out successfully' });
      router.replace('/');
    } catch (err) {
      toast({ title: 'Could not sign out', variant: 'destructive' });
    }
  };

  const displayName = userProfile?.account?.displayName || user?.displayName || 'Cricket Player';
  const username = userProfile?.account?.username || (user?.uid ? `user_${user.uid.slice(0, 6)}` : 'player');
  const photoURL = userProfile?.account?.photoURL || user?.photoURL || '';
  const initial = displayName[0]?.toUpperCase() || 'P';

  const city = userProfile?.location?.city || '';
  const state = userProfile?.location?.state || '';
  const country = userProfile?.location?.country || '';
  const locationText = city && country ? `${city}, ${country}` : country || 'Location Not Set';

  const primaryRole = userProfile?.cricket?.primaryRole ? userProfile.cricket.primaryRole.replace('_', ' ') : 'Unspecified';
  const jerseyNumber = userProfile?.cricket?.jerseyNumber || null;
  const bio = userProfile?.account?.bio || 'Passionate cricketer on CricNinja.';
  const favoriteFormats = userProfile?.cricket?.favoriteFormats || [];

  const matches = userProfile?.careerStats?.matches || 0;
  const runs = userProfile?.careerStats?.runs || 0;
  const wickets = userProfile?.careerStats?.wickets || 0;
  const highestScore = userProfile?.careerStats?.highestScore || 0;
  const bestBowling = userProfile?.careerStats?.bestBowling || '0/0';

  // Calculated Real Win Percentage (never fabricated)
  const winPercentage = matches > 0 && userProfile?.careerStats?.wins != null
    ? `${Math.round((userProfile.careerStats.wins / matches) * 100)}%`
    : matches > 0 ? 'N/A' : '0%';

  const battingAvg = matches > 0 ? (runs / matches).toFixed(1) : '0.0';
  const strikeRate = matches > 0 && userProfile?.careerStats?.ballsFaced 
    ? ((runs / userProfile.careerStats.ballsFaced) * 100).toFixed(1) 
    : matches > 0 ? 'N/A' : '0.0';

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-body select-none">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-headline font-black text-lg uppercase tracking-tight">Player Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-5">
        
        {/* Main Player Identity Card */}
        <Card className="bg-card border-primary/20 shadow-2xl rounded-3xl p-6 relative overflow-hidden space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shrink-0 shadow-lg relative bg-muted">
                {photoURL ? (
                  <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center font-black text-2xl text-primary">
                    {initial}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline font-black text-xl uppercase tracking-tight">{displayName}</h2>
                  {jerseyNumber && (
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black">
                      #{jerseyNumber}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-primary font-mono font-bold">@{username}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-border text-muted-foreground">
                    {primaryRole}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-border text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {locationText}
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/onboarding')}
              className="rounded-2xl shrink-0 h-9 w-9"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-muted/20 p-3 rounded-2xl">
            {bio}
          </p>

          {/* Core Career Stats Summary */}
          <div className="grid grid-cols-4 gap-2 bg-muted/40 p-3 rounded-2xl text-center border border-border/40">
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase">MATCHES</p>
              <p className="text-base font-black text-foreground tabular-nums">{matches}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase">RUNS</p>
              <p className="text-base font-black text-primary tabular-nums">{runs}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase">WICKETS</p>
              <p className="text-base font-black text-foreground tabular-nums">{wickets}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase">WIN %</p>
              <p className="text-base font-black text-emerald-500 tabular-nums">{winPercentage}</p>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-2xl p-1 h-12">
            <TabsTrigger value="overview" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Overview</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Stats</TabsTrigger>
            <TabsTrigger value="rankings" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Rankings</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Matches</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs">
              <h3 className="font-headline font-black text-sm uppercase tracking-tight flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Playing Style & Formats
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Batting Hand</span>
                  <p className="font-bold uppercase text-foreground">{userProfile?.cricket?.batting?.hand ? `${userProfile.cricket.batting.hand} Hand` : 'Unspecified'}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Bowling Style</span>
                  <p className="font-bold uppercase text-foreground">{userProfile?.cricket?.bowling?.style ? userProfile.cricket.bowling.style.replace('_', ' ') : 'Unspecified'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Favorite Formats</span>
                <div className="flex flex-wrap gap-2">
                  {favoriteFormats.length > 0 ? (
                    favoriteFormats.map((fmt) => (
                      <Badge key={fmt} variant="secondary" className="rounded-full px-3 py-1 font-bold text-xs">
                        {fmt}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No format specified</span>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border rounded-3xl p-5 space-y-3 shadow-xs">
              <h3 className="font-headline font-black text-sm uppercase tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Badges & Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {userProfile?.badges && userProfile.badges.length > 0 ? (
                  userProfile.badges.map((b) => (
                    <Badge key={b} className="bg-primary/10 text-primary border-primary/30 font-black text-[10px] uppercase py-1.5 px-3">
                      ⭐ {b}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Play matches to earn official badges!</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs">
              <h3 className="font-headline font-black text-sm uppercase tracking-tight flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Career Records
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Highest Score</span>
                  <p className="text-xl font-black text-foreground">{highestScore}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Best Bowling</span>
                  <p className="text-xl font-black text-foreground">{bestBowling}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Batting Avg</span>
                  <p className="text-xl font-black text-primary">{battingAvg}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Strike Rate</span>
                  <p className="text-xl font-black text-foreground">{strikeRate}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-headline font-black text-sm uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Current Standing
                </h3>
                <Link href="/leaderboard">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-[10px] font-black uppercase gap-1 text-primary">
                    View Leaderboard <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center bg-muted/40 p-3 rounded-2xl border border-border/40">
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">{city || 'City'}</p>
                  <p className="text-xs font-black text-amber-500">#--</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">{state || 'State'}</p>
                  <p className="text-xs font-black text-foreground">#--</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">{country || 'Country'}</p>
                  <p className="text-xs font-black text-foreground">#--</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">Global</p>
                  <p className="text-xs font-black text-foreground">#--</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs text-center">
              <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-headline font-black text-sm uppercase tracking-tight">Match History</h4>
                <p className="text-xs text-muted-foreground">Your scored matches will appear here automatically.</p>
              </div>
              <Button onClick={() => router.push('/matches/create')} className="h-11 rounded-2xl font-black uppercase text-xs text-white">
                Start New Match
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
