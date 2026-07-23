import { Firestore, collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { CricNinjaUser } from '@/types/user';

export type ScopeType = 'city' | 'state' | 'country' | 'global';
export type MetricType = 'runs' | 'wickets' | 'matches';
export type PeriodType = 'all_time';

export interface LeaderboardEntry extends CricNinjaUser {
  rankChange?: number;
}

export interface UserRankSummary {
  cityRank: string;
  stateRank: string;
  countryRank: string;
  globalRank: string;
  rankImprovementText?: string;
  matchesPlayed?: number;
}

export interface FetchLeaderboardResult {
  top10: LeaderboardEntry[];
  userInTop10: boolean;
  userRank: number | null;
}

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Production Leaderboard Service
 * Performs real Firestore queries and accurate user rank calculations based on cricket statistics.
 */
export class LeaderboardService {
  private static cache: Record<string, { timestamp: number; data: FetchLeaderboardResult }> = {};
  private static CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

  /**
   * Fetches Top 10 players for a scope using server-side ordering and accurate user rank resolution.
   */
  static async fetchTop10Leaderboard(
    db: Firestore,
    scope: ScopeType,
    userProfile: CricNinjaUser | null,
    metric: MetricType = 'runs',
    period: PeriodType = 'all_time'
  ): Promise<FetchLeaderboardResult> {
    const cacheKey = `${scope}_${metric}_${userProfile?.uid || 'guest'}`;
    const now = Date.now();

    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.CACHE_TTL_MS) {
      return this.cache[cacheKey].data;
    }

    const usersRef = collection(db, 'users');
    let rawTop10: CricNinjaUser[] = [];

    let metricField = 'careerStats.runs';
    let userMetricVal = userProfile?.careerStats?.runs || 0;

    if (metric === 'wickets') {
      metricField = 'careerStats.wickets';
      userMetricVal = userProfile?.careerStats?.wickets || 0;
    } else if (metric === 'matches') {
      metricField = 'careerStats.matches';
      userMetricVal = userProfile?.careerStats?.matches || 0;
    }

    try {
      let q;
      if (scope === 'city' && userProfile?.location?.cityId) {
        q = query(
          usersRef,
          where('location.cityId', '==', userProfile.location.cityId),
          orderBy(metricField, 'desc'),
          limit(10)
        );
      } else if (scope === 'state' && userProfile?.location?.stateId) {
        q = query(
          usersRef,
          where('location.stateId', '==', userProfile.location.stateId),
          orderBy(metricField, 'desc'),
          limit(10)
        );
      } else if (scope === 'country' && userProfile?.location?.countryId) {
        q = query(
          usersRef,
          where('location.countryId', '==', userProfile.location.countryId),
          orderBy(metricField, 'desc'),
          limit(10)
        );
      } else {
        // Global Scope
        q = query(usersRef, orderBy(metricField, 'desc'), limit(10));
      }

      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        rawTop10.push(docSnap.data() as CricNinjaUser);
      });
    } catch (err) {
      console.warn("Direct indexed query fallback:", err);
      try {
        let fallbackQuery;
        if (scope === 'city' && userProfile?.location?.cityId) {
          fallbackQuery = query(usersRef, where('location.cityId', '==', userProfile.location.cityId), limit(10));
        } else {
          fallbackQuery = query(usersRef, limit(10));
        }
        const snap = await getDocs(fallbackQuery);
        snap.forEach((docSnap) => rawTop10.push(docSnap.data() as CricNinjaUser));
      } catch (e) {
        console.error("Leaderboard query error:", e);
      }
    }

    // Gated development mock players if database has fewer than 10 users during local testing
    if (IS_DEV && rawTop10.length < 10) {
      const demoPlayers: CricNinjaUser[] = [
        {
          uid: 'demo_1',
          email: 'rahul@cricninja.com',
          profileCompleted: true,
          onboardingStep: 9,
          profileCompletion: 100,
          createdAt: null,
          updatedAt: null,
          account: { displayName: 'Rahul Sharma', username: 'rahul_smash', photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150', bio: 'Aggressive opening batter' },
          location: { countryId: 'IN', country: 'India', stateId: 'IN-TG', state: 'Telangana', cityId: 'IN-TG-HYD', city: 'Hyderabad' },
          cricket: { primaryRole: 'batter', batting: { hand: 'right', position: 'opener' }, bowling: { arm: 'right', style: 'off_spin' }, jerseyNumber: 18, favoriteFormats: ['T20'] },
          social: { followers: 120, following: 40, verified: true },
          careerStats: { matches: 42, runs: 1280, wickets: 14, highestScore: 112, bestBowling: '3/18' },
          achievements: [], badges: []
        },
        {
          uid: 'demo_2',
          email: 'vikram@cricninja.com',
          profileCompleted: true,
          onboardingStep: 9,
          profileCompletion: 100,
          createdAt: null,
          updatedAt: null,
          account: { displayName: 'Vikram Reddy', username: 'vikram_bowls', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', bio: 'Fast bowler with lethal yorkers' },
          location: { countryId: 'IN', country: 'India', stateId: 'IN-TG', state: 'Telangana', cityId: 'IN-TG-HYD', city: 'Hyderabad' },
          cricket: { primaryRole: 'bowler', batting: { hand: 'right', position: 'finisher' }, bowling: { arm: 'right', style: 'fast' }, jerseyNumber: 99, favoriteFormats: ['T20'] },
          social: { followers: 95, following: 20, verified: false },
          careerStats: { matches: 38, runs: 420, wickets: 58, highestScore: 45, bestBowling: '5/12' },
          achievements: [], badges: []
        }
      ];

      const existingUids = new Set(rawTop10.map(u => u.uid));
      demoPlayers.forEach(dp => {
        if (!existingUids.has(dp.uid) && rawTop10.length < 10) {
          rawTop10.push(dp);
        }
      });
    }

    const top10: LeaderboardEntry[] = rawTop10.map((user) => ({
      ...user,
    }));

    let userInTop10 = false;
    let userRank: number | null = null;

    if (userProfile) {
      const foundIdx = top10.findIndex((u) => u.uid === userProfile.uid);
      if (foundIdx !== -1) {
        userInTop10 = true;
        userRank = foundIdx + 1;
      } else if (userMetricVal > 0) {
        // Calculate true rank by counting users with a higher metric score
        try {
          let rankQuery;
          if (scope === 'city' && userProfile.location?.cityId) {
            rankQuery = query(usersRef, where('location.cityId', '==', userProfile.location.cityId), where(metricField, '>', userMetricVal));
          } else if (scope === 'state' && userProfile.location?.stateId) {
            rankQuery = query(usersRef, where('location.stateId', '==', userProfile.location.stateId), where(metricField, '>', userMetricVal));
          } else if (scope === 'country' && userProfile.location?.countryId) {
            rankQuery = query(usersRef, where('location.countryId', '==', userProfile.location.countryId), where(metricField, '>', userMetricVal));
          } else {
            rankQuery = query(usersRef, where(metricField, '>', userMetricVal));
          }
          const countSnap = await getCountFromServer(rankQuery);
          userRank = countSnap.data().count + 1;
        } catch (e) {
          userRank = null;
        }
      } else {
        userRank = null; // Unranked if 0 score
      }
    }

    const result: FetchLeaderboardResult = { top10, userInTop10, userRank };
    this.cache[cacheKey] = { timestamp: now, data: result };
    return result;
  }

  /**
   * Fetches accurate user rankings summary across City, State, Country, and Global scopes.
   */
  static async fetchUserRankingsSummary(
    db: Firestore,
    userProfile: CricNinjaUser | null
  ): Promise<UserRankSummary> {
    if (!userProfile || !userProfile.uid) {
      return {
        cityRank: '#--',
        stateRank: '#--',
        countryRank: '#--',
        globalRank: '#--',
        rankImprovementText: 'Sign in to see rankings',
        matchesPlayed: 0,
      };
    }

    const currentRuns = userProfile.careerStats?.runs || 0;
    const matchesPlayed = userProfile.careerStats?.matches || 0;

    const usersRef = collection(db, 'users');

    const getRankText = async (q: any): Promise<string> => {
      if (currentRuns === 0) return '#--';
      try {
        const countSnap = await getCountFromServer(q);
        const rank = countSnap.data().count + 1;
        return `#${rank}`;
      } catch (e) {
        return '#--';
      }
    };

    let cityRank = '#--';
    let stateRank = '#--';
    let countryRank = '#--';
    let globalRank = '#--';

    if (userProfile.location?.cityId) {
      cityRank = await getRankText(query(usersRef, where('location.cityId', '==', userProfile.location.cityId), where('careerStats.runs', '>', currentRuns)));
    }

    if (userProfile.location?.stateId) {
      stateRank = await getRankText(query(usersRef, where('location.stateId', '==', userProfile.location.stateId), where('careerStats.runs', '>', currentRuns)));
    }

    if (userProfile.location?.countryId) {
      countryRank = await getRankText(query(usersRef, where('location.countryId', '==', userProfile.location.countryId), where('careerStats.runs', '>', currentRuns)));
    }

    globalRank = await getRankText(query(usersRef, where('careerStats.runs', '>', currentRuns)));

    return {
      cityRank,
      stateRank,
      countryRank,
      globalRank,
      rankImprovementText: currentRuns > 0 ? 'Official Ranking Active' : 'Play matches to unlock rank',
      matchesPlayed,
    };
  }
}
