
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Trophy, 
  Clock, 
  ShieldCheck,
  UserPlus,
  ArrowRight,
  Download,
  Smartphone,
  Share2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMatchStore, Match } from '@/lib/match-store';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { BannerAd } from '@/components/BannerAd';
import { Badge } from '@/components/ui/badge';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const router = useRouter();
  const { matches, joinedMatchIds, joinMatch } = useMatchStore();
  const { firestore: db } = useFirebase();
  
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast({ title: "App Installed!", description: "CricNinja is now on your home screen." });
    });

    const checkHydration = () => {
      if (useMatchStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };
    checkHydration();
    const unsub = useMatchStore.persist.onFinishHydration(checkHydration);
    
    return () => {
      unsub();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    async function loadRecentMatches() {
      if (!mounted || !isHydrated || !db) return;

      const combinedMap = new Map<string, Match>();
      matches.forEach(m => combinedMap.set(m.id, m));

      for (const id of joinedMatchIds) {
        if (!combinedMap.has(id)) {
          try {
            const matchRef = doc(db, 'matches', id);
            const snapshot = await getDoc(matchRef);
            if (snapshot.exists()) {
              combinedMap.set(id, snapshot.data() as Match);
            }
          } catch (e) {
            console.error("Error fetching joined match:", e);
          }
        }
      }

      const sorted = Array.from(combinedMap.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
        
      setRecentMatches(sorted);
      setIsLoadingMatches(false);
    }

    if (isHydrated) {
      loadRecentMatches();
    }
  }, [mounted, isHydrated, matches, joinedMatchIds, db]);

  const handleJoinMatch = async () => {
    if (!joinId.trim() || !db) return;
    setIsJoining(true);
    
    try {
      const matchRef = doc(db, 'matches', joinId.trim());
      const snapshot = await getDoc(matchRef);
      
      if (snapshot.exists()) {
        joinMatch(joinId.trim());
        toast({ title: "Match Joined!", description: "Syncing scoreboard..." });
        router.push(`/live?id=${joinId.trim()}`);
      } else {
        toast({ variant: "destructive", title: "Invalid ID", description: "Match not found." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Error", description: "Could not connect to server." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallDialog(true);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'CricNinja',
      text: 'Track every ball and share live scores with CricNinja - The pro scoring app for local cricket!',
      url: 'https://cricninja.vercel.app/',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: "Link Copied!", description: "App URL saved to clipboard." });
      }
    } catch (err) {
      // Silent fail for user cancel
    }
  };

  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-black text-[10px] text-muted-foreground uppercase tracking-widest">Warming Up...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-body">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary text-white text-[10px] font-black uppercase">
              CN
            </AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-headline font-black tracking-tight text-primary">CricNinja</h1>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!isStandalone && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full text-primary hover:bg-primary/5 font-black uppercase text-[10px] gap-2 h-9 px-4"
              onClick={handleInstallClick}
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        <section className="py-2 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-headline font-bold text-foreground leading-tight">
              Hi, Scorer! 👋
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Live scoring and real-time match tracking.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full border-primary text-primary font-black uppercase text-[10px] gap-2">
                <UserPlus className="w-3 h-3" /> Join Match
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-[90vw]">
              <DialogHeader>
                <DialogTitle className="text-center font-black uppercase tracking-tight">Join Scoreboard</DialogTitle>
                <DialogDescription className="text-center text-xs text-muted-foreground">Enter the unique Match UID to join as a spectator or scorer.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-black uppercase text-center tracking-widest">Enter Match UID</p>
                  <Input 
                    placeholder="e.g. cb7497de-fa2c..." 
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="h-12 rounded-2xl border-border bg-muted/50 font-mono text-center text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                  onClick={handleJoinMatch}
                  disabled={isJoining || !joinId}
                >
                  {isJoining ? 'Connecting...' : 'Join Match'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/matches/create">
            <Card className="bg-primary text-primary-foreground border-none relative group active:scale-[0.98] transition-all shadow-xl shadow-primary/20 rounded-3xl overflow-hidden h-full">
              <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm w-fit mb-4">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight uppercase">New Match</h3>
                  <p className="text-[10px] opacity-90 font-medium">Start scoring</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card 
            className="bg-secondary text-secondary-foreground border-none relative group active:scale-[0.98] transition-all shadow-xl shadow-secondary/20 rounded-3xl overflow-hidden h-full cursor-pointer"
            onClick={handleShareApp}
          >
            <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm w-fit mb-4">
                <Share2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight uppercase">Share App</h3>
                <p className="text-[10px] opacity-90 font-medium">Invite others</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <BannerAd />

        <section className="bg-secondary/10 p-6 rounded-3xl border border-secondary/20 flex items-center gap-4">
          <div className="bg-secondary p-3 rounded-2xl"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <div>
            <Badge className="bg-secondary text-white border-none text-[10px] mb-1 font-black">PRO STATS</Badge>
            <h3 className="text-sm font-black text-foreground leading-tight">Advanced Strike Rate & Economy tracking</h3>
          </div>
        </section>

        {isLoadingMatches ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Syncing history...</p>
          </div>
        ) : recentMatches.length > 0 ? (
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> 
                RECENT MATCHES
              </h2>
              <Badge variant="outline" className="text-[9px] font-black uppercase border-border text-muted-foreground">
                LATEST 3
              </Badge>
            </div>

            <div className="grid gap-4">
              {recentMatches.map((match) => {
                const isLocalScorer = matches.some(m => m.id === match.id);
                
                return (
                  <Link 
                    key={match.id} 
                    href={isLocalScorer ? `/matches/scoring?id=${match.id}` : `/live?id=${match.id}`}
                  >
                    <Card className="bg-card border-none shadow-sm rounded-2xl ring-1 ring-border active:scale-[0.99] transition-transform overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-5 flex justify-between items-center">
                          <div className="space-y-1 overflow-hidden flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${match.status === 'ongoing' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                                {match.status}
                              </span>
                              {isLocalScorer ? (
                                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">SCORER</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px] font-black border-border text-muted-foreground uppercase">SPECTATING</Badge>
                              )}
                            </div>
                            <p className="font-bold text-foreground truncate">{match.teamA.name} vs {match.teamB.name}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{format(match.timestamp, 'MMM d, h:mm a')}</p>
                          </div>
                          <div className="text-right pl-4">
                            <p className="text-2xl font-black text-primary tabular-nums">
                              {match.currentInnings === 1 ? match.innings1.totalRuns : match.innings2.totalRuns}
                              <span className="text-xs opacity-40">/{match.currentInnings === 1 ? match.innings1.totalWickets : match.innings2.totalWickets}</span>
                            </p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase">Overs {Math.floor((match.currentInnings === 1 ? match.innings1.totalBalls : match.innings2.totalBalls) / 6)}.{ (match.currentInnings === 1 ? match.innings1.totalBalls : match.innings2.totalBalls) % 6 }</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/30 ml-4 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="bg-card rounded-3xl p-10 text-center shadow-sm border border-dashed border-border">
            <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">
              No recent matches
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-bold">
              Start scoring a new game to see it here
            </p>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-md border-t px-8 py-3 flex justify-around items-center safe-paddings shadow-lg">
         <div className="flex flex-col items-center gap-1 text-primary cursor-pointer">
           <Trophy className="w-6 h-6" />
           <span className="text-[9px] font-black uppercase">MY GAMES</span>
         </div>
         <Link href="/matches/create" className="flex flex-col items-center gap-1 text-muted-foreground">
           <PlusCircle className="w-6 h-6" />
           <span className="text-[9px] font-black uppercase tracking-widest">START NEW</span>
         </Link>
      </footer>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="rounded-3xl max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-center font-black uppercase tracking-tight">Install CricNinja</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">Follow the steps below to add CricNinja to your home screen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-foreground uppercase text-sm tracking-tight">Add to Home Screen</p>
              <p className="text-xs text-muted-foreground leading-relaxed px-4">
                To install CricNinja, tap the <span className="font-black text-primary">Share</span> button in your browser and select <span className="font-black text-primary">"Add to Home Screen"</span>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest" onClick={() => setShowInstallDialog(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
