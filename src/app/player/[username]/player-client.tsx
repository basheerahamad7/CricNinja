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
  Share2, 
  Copy, 
  ArrowLeft,
  Award,
  Star,
  Activity,
  Calendar,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { CricNinjaUser } from '@/types/user';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { BottomNavigation } from '@/components/BottomNavigation';

interface PublicPlayerClientProps {
  player: CricNinjaUser;
}

export function PublicPlayerClient({ player }: PublicPlayerClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'rankings' | 'achievements'>('overview');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const displayName = player.account?.displayName || 'Cricket Player';
  const username = player.account?.username || 'player';
  const photoURL = player.account?.photoURL || '';
  const initial = displayName[0]?.toUpperCase() || 'P';

  const city = player.location?.city || 'Hyderabad';
  const state = player.location?.state || 'Telangana';
  const country = player.location?.country || 'India';
  const primaryRole = player.cricket?.primaryRole?.replace('_', ' ') || 'All Rounder';
  const jerseyNumber = player.cricket?.jerseyNumber;
  const bio = player.account?.bio || 'Official CricNinja player profile.';
  const favoriteFormats = player.cricket?.favoriteFormats || ['T20', 'Box Cricket'];

  const matches = player.careerStats?.matches || 0;
  const runs = player.careerStats?.runs || 0;
  const wickets = player.careerStats?.wickets || 0;
  const highestScore = player.careerStats?.highestScore || 0;
  const bestBowling = player.careerStats?.bestBowling || '0/0';

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/player/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} - CricNinja Profile`,
          text: `Check out ${displayName}'s official cricket stats on CricNinja!`,
          url: profileUrl,
        });
        return;
      } catch (e) {}
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
      toast({
        title: 'Link Copied! 🔗',
        description: `Profile link copied: ${profileUrl}`,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      toast({ title: 'Could not copy link', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-body select-none">
      
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-headline font-black text-lg uppercase tracking-tight">Public Profile</h1>
          </div>
        </div>
        <Button
          onClick={handleShare}
          variant="outline"
          className="rounded-full font-black text-xs uppercase gap-1.5 border-primary/30 text-primary"
        >
          {isCopied ? <UserCheck className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {isCopied ? 'Copied' : 'Share'}
        </Button>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-5">
        
        {/* Main Player Identity Hero Card */}
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
                  {player.social?.verified && (
                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </Badge>
                  )}
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
                    <MapPin className="w-2.5 h-2.5" /> {city}, {country}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-muted/20 p-3 rounded-2xl">
            {bio}
          </p>

          {/* Career Stats Grid */}
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
              <p className="text-[8px] font-black text-muted-foreground uppercase">BEST</p>
              <p className="text-base font-black text-emerald-500 tabular-nums">{highestScore || bestBowling}</p>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-2xl p-1 h-12">
            <TabsTrigger value="overview" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Overview</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Stats</TabsTrigger>
            <TabsTrigger value="rankings" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Rankings</TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl text-[10px] font-black uppercase truncate px-1">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs">
              <h3 className="font-headline font-black text-sm uppercase tracking-tight flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Skillset & Formats
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Batting Style</span>
                  <p className="font-bold uppercase text-foreground">{player.cricket?.batting?.hand || 'Right'} Hand</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Bowling Style</span>
                  <p className="font-bold uppercase text-foreground">{player.cricket?.bowling?.style || 'Right Arm Fast'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Favorite Formats</span>
                <div className="flex flex-wrap gap-2">
                  {favoriteFormats.map((fmt) => (
                    <Badge key={fmt} variant="secondary" className="rounded-full px-3 py-1 font-bold text-xs">
                      {fmt}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

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
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rankings" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-headline font-black text-sm uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Community Standing
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center bg-muted/40 p-3 rounded-2xl border border-border/40">
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">{city}</p>
                  <p className="text-xs font-black text-amber-500">#12</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">{state}</p>
                  <p className="text-xs font-black text-foreground">#58</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">{country}</p>
                  <p className="text-xs font-black text-foreground">#421</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">Global</p>
                  <p className="text-xs font-black text-foreground">#5,812</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4 pt-3">
            <Card className="bg-card border-border rounded-3xl p-5 space-y-4 shadow-xs text-center">
              <Award className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="font-headline font-black text-sm uppercase tracking-tight">Badges & Accomplishments</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge className="bg-primary/10 text-primary border-primary/30 font-black text-[10px] uppercase py-1.5 px-3">
                  🥇 Local Legend
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-black text-[10px] uppercase py-1.5 px-3">
                  🔥 Community Star
                </Badge>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
