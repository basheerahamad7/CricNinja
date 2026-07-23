"use client";

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  Zap, 
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  Search,
  RotateCw,
  ChevronDown
} from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { CricNinjaUser } from '@/types/user';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerProfileModal } from '@/components/PlayerProfileModal';
import { LeaderboardSkeleton } from '@/components/LeaderboardSkeleton';
import { OfflineErrorBanner } from '@/components/OfflineErrorBanner';
import { LeaderboardService, ScopeType, MetricType, LeaderboardEntry } from '@/services/leaderboard';

export type SeasonalPeriod = 'all_time' | 'season_2026' | 'this_month' | 'this_week';

export function Leaderboard() {
  const { firestore: db } = useFirebase();
  const { userProfile } = useUser();

  const [scope, setScope] = useState<ScopeType>('city');
  const [metric, setMetric] = useState<MetricType>('runs');
  const [period, setPeriod] = useState<SeasonalPeriod>('all_time');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [userInTop10, setUserInTop10] = useState<boolean>(false);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<CricNinjaUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const cityLabel = userProfile?.location?.city || 'City';
  const stateLabel = userProfile?.location?.state || 'State';
  const countryLabel = userProfile?.location?.country || 'Country';

  const loadData = async (forceRefresh = false) => {
    if (!db) return;
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setHasError(false);

    try {
      const res = await LeaderboardService.fetchTop10Leaderboard(db, scope, userProfile, metric);
      setLeaderboardData(res.top10);
      setUserInTop10(res.userInTop10);
      setUserRank(res.userRank);
    } catch (err) {
      console.error('Leaderboard load error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [db, scope, metric, period, userProfile]);

  const handlePlayerClick = (player: CricNinjaUser) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const filteredData = leaderboardData.filter((player) => {
    if (!searchQuery.trim()) return true;
    const nameMatch = player.account?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const usernameMatch = player.account?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || usernameMatch;
  });

  const getMetricValue = (u: CricNinjaUser) => {
    if (metric === 'runs') return `${u.careerStats?.runs || 0} runs`;
    if (metric === 'wickets') return `${u.careerStats?.wickets || 0} wkts`;
    if (metric === 'matches') return `${u.careerStats?.matches || 0} matches`;
    return '0';
  };

  const getRankBadgeColor = (idx: number) => {
    if (idx === 0) return 'bg-amber-400 text-amber-950 font-black shadow-md shadow-amber-400/20 ring-2 ring-amber-300';
    if (idx === 1) return 'bg-slate-300 text-slate-900 font-black';
    if (idx === 2) return 'bg-amber-700 text-amber-100 font-black';
    return 'bg-muted text-muted-foreground font-bold';
  };

  const renderRankChange = (change?: number) => {
    if (!change || change === 0) {
      return (
        <span className="flex items-center text-[9px] font-bold text-muted-foreground/60 gap-0.5">
          <Minus className="w-2.5 h-2.5" />
        </span>
      );
    }
    if (change > 0) {
      return (
        <span className="flex items-center text-[9px] font-black text-emerald-500 gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
          <ArrowUp className="w-2.5 h-2.5" /> {change}
        </span>
      );
    }
    return (
      <span className="flex items-center text-[9px] font-black text-destructive gap-0.5 bg-destructive/10 px-1.5 py-0.5 rounded-md">
        <ArrowDown className="w-2.5 h-2.5" /> {Math.abs(change)}
      </span>
    );
  };

  return (
    <div className="space-y-4 select-none">
      
      {/* Header Actions: Refresh & Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name or handle..."
            className="h-10 pl-9 rounded-2xl border-border bg-muted/30 font-medium text-xs"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="h-10 w-10 rounded-2xl shrink-0"
        >
          <RotateCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Scope Tabs */}
      <Tabs defaultValue="city" value={scope} onValueChange={(val) => setScope(val as ScopeType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-2xl p-1 h-12">
          <TabsTrigger value="city" className="rounded-xl text-[10px] font-black uppercase tracking-tight truncate px-1">
            {cityLabel}
          </TabsTrigger>
          <TabsTrigger value="state" className="rounded-xl text-[10px] font-black uppercase tracking-tight truncate px-1">
            {stateLabel}
          </TabsTrigger>
          <TabsTrigger value="country" className="rounded-xl text-[10px] font-black uppercase tracking-tight truncate px-1">
            {countryLabel}
          </TabsTrigger>
          <TabsTrigger value="global" className="rounded-xl text-[10px] font-black uppercase tracking-tight truncate px-1">
            Global
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Seasonal Period Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all_time', label: 'All-Time' },
          { id: 'season_2026', label: '2026 Season' },
          { id: 'this_month', label: 'This Month' },
          { id: 'this_week', label: 'This Week' },
        ].map((p) => {
          const isSel = period === p.id;
          return (
            <Badge
              key={p.id}
              variant={isSel ? 'default' : 'outline'}
              onClick={() => setPeriod(p.id as SeasonalPeriod)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-bold uppercase text-[9px] whitespace-nowrap transition-all ${
                isSel ? 'bg-primary text-white shadow-sm' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {p.label}
            </Badge>
          );
        })}
      </div>

      {/* Metric Selector Buttons */}
      <div className="flex gap-2">
        {[
          { id: 'runs', label: 'Most Runs', icon: Trophy },
          { id: 'wickets', label: 'Most Wickets', icon: Target },
          { id: 'matches', label: 'Most Matches', icon: Zap },
        ].map((m) => {
          const Icon = m.icon;
          const isSelected = metric === m.id;
          return (
            <Button
              key={m.id}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => setMetric(m.id as MetricType)}
              className={`flex-1 h-10 rounded-2xl font-black text-[10px] uppercase gap-1.5 ${
                isSelected ? 'text-white shadow-md shadow-primary/20' : 'border-border text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </Button>
          );
        })}
      </div>

      {/* Error Banner */}
      {hasError && (
        <OfflineErrorBanner
          message="Could not load leaderboard data. Please retry."
          onRetry={() => loadData(true)}
          isRetrying={isRefreshing}
        />
      )}

      {/* Leaderboard Loading Skeleton or List */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : (
        <Card className="border-border bg-card shadow-xl rounded-3xl overflow-hidden p-2">
          <CardContent className="p-2 space-y-2">
            {filteredData.length > 0 ? (
              <div className="space-y-2">
                {filteredData.map((player, idx) => {
                  const isCurrentUser = userProfile?.uid === player.uid;
                  return (
                    <div
                      key={player.uid || idx}
                      onClick={() => handlePlayerClick(player)}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                        isCurrentUser 
                          ? 'bg-primary/10 border-2 border-primary/40 ring-1 ring-primary/20 shadow-md' 
                          : 'bg-muted/30 hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${getRankBadgeColor(idx)}`}>
                          {idx === 0 ? <Crown className="w-4 h-4 fill-amber-950" /> : idx + 1}
                        </div>

                        <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                          {player.account?.photoURL ? (
                            <img src={player.account.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xs text-primary">
                              {player.account?.displayName?.[0] || 'P'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-foreground truncate">{player.account?.displayName}</p>
                            {renderRankChange(player.rankChange)}
                            {isCurrentUser && (
                              <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase px-1.5 py-0">YOU</Badge>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground font-mono truncate">
                            @{player.account?.username || 'player'} • {player.location?.city || 'Local'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <p className="font-black text-xs text-primary tabular-nums">{getMetricValue(player)}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Pinned Row for Current User if outside Top 10 */}
                {!userInTop10 && userProfile && !searchQuery && (
                  <div className="pt-2">
                    <div className="border-t border-dashed border-border my-2 flex items-center justify-center">
                      <span className="bg-card px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground -mt-2.5">
                        Your Position
                      </span>
                    </div>

                    <div 
                      onClick={() => handlePlayerClick(userProfile)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 border-2 border-primary shadow-lg ring-2 ring-primary/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md">
                          #{userRank || '10+'}
                        </div>

                        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary shrink-0 bg-primary/20">
                          {userProfile.account?.photoURL ? (
                            <img src={userProfile.account.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xs text-primary">
                              {userProfile.account?.displayName?.[0] || 'Y'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-xs text-foreground truncate">{userProfile.account?.displayName}</p>
                            <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase">YOU</Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground font-mono truncate">
                            @{userProfile.account?.username} • {userProfile.location?.city}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <p className="font-black text-xs text-primary tabular-nums">{getMetricValue(userProfile)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {searchQuery ? 'No matching players found' : `No players ranked in ${scope} yet`}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 max-w-xs mx-auto">
                    {searchQuery ? 'Try searching for another name or handle.' : `Be the first player from ${userProfile?.location?.city || 'your area'} to play a match!`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination / Load More Footer Action */}
      {!isLoading && leaderboardData.length > 0 && (
        <div className="text-center pt-1">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase text-muted-foreground gap-1">
            Top 10 Rankings Loaded <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Public Player Profile Modal */}
      <PlayerProfileModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
