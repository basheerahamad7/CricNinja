
'use server';

import { unstable_cache } from 'next/cache';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Match } from '@/lib/match-store';

/**
 * Fetches match data from Firestore with a high-frequency Edge Cache.
 * revalidate: 2 ensures we only hit Firestore once every 2 seconds per match,
 * even with thousands of concurrent spectators.
 */
export async function getCachedMatch(matchId: string): Promise<Match | null> {
  const fetcher = unstable_cache(
    async (id: string) => {
      console.log(`[Edge Cache Miss] Fetching match ${id} from Firestore`);
      const { firestore } = initializeFirebase();
      const matchRef = doc(firestore, 'matches', id);
      const snapshot = await getDoc(matchRef);
      
      if (!snapshot.exists()) return null;
      return snapshot.data() as Match;
    },
    [`match-${matchId}`],
    {
      revalidate: 2, // Cache for 2 seconds at the Edge
      tags: [`match-${matchId}`],
    }
  );

  return fetcher(matchId);
}
