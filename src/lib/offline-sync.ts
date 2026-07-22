"use client";

import { useState, useEffect, useCallback } from 'react';
import { Match } from './match-store';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export type SyncStatusState = 'synced' | 'syncing' | 'offline' | 'pending';

export interface LocalMatchEntry {
  id: string;
  matchData: Match;
  syncStatus: SyncStatusState;
  lastUpdated: number;
  retryCount: number;
}

const DB_NAME = 'CricNinjaOfflineDB';
const STORE_NAME = 'offline_matches';
const DB_VERSION = 1;

/**
 * IndexedDB helper for CricNinja local match persistence
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class OfflineSyncService {
  /** Save or update match locally in IndexedDB */
  static async saveLocalMatch(match: Match, status: SyncStatusState = 'pending'): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const entry: LocalMatchEntry = {
        id: match.id,
        matchData: match,
        syncStatus: status,
        lastUpdated: Date.now(),
        retryCount: 0,
      };

      store.put(entry);

      // Also back up to localStorage for fallback
      try {
        localStorage.setItem(`cricninja_match_${match.id}`, JSON.stringify(match));
        localStorage.setItem('cricninja_last_unfinished_match', match.id);
      } catch (e) {
        // localStorage quota ignored
      }
    } catch (err) {
      console.warn('IndexedDB save fallback to localStorage:', err);
      try {
        localStorage.setItem(`cricninja_match_${match.id}`, JSON.stringify(match));
        localStorage.setItem('cricninja_last_unfinished_match', match.id);
      } catch (e) {}
    }
  }

  /** Get local match by ID */
  static async getLocalMatch(matchId: string): Promise<Match | null> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(matchId);

      return new Promise((resolve) => {
        req.onsuccess = () => {
          if (req.result?.matchData) {
            resolve(req.result.matchData);
          } else {
            const raw = localStorage.getItem(`cricninja_match_${matchId}`);
            resolve(raw ? JSON.parse(raw) : null);
          }
        };
        req.onerror = () => {
          const raw = localStorage.getItem(`cricninja_match_${matchId}`);
          resolve(raw ? JSON.parse(raw) : null);
        };
      });
    } catch (err) {
      const raw = localStorage.getItem(`cricninja_match_${matchId}`);
      return raw ? JSON.parse(raw) : null;
    }
  }

  /** Get all pending local matches that need upload */
  static async getPendingMatches(): Promise<LocalMatchEntry[]> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      return new Promise((resolve) => {
        req.onsuccess = () => {
          const entries: LocalMatchEntry[] = req.result || [];
          resolve(entries.filter((e) => e.syncStatus === 'pending' || e.syncStatus === 'offline'));
        };
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      return [];
    }
  }

  /** Mark match as synced */
  static async markMatchSynced(matchId: string): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(matchId);

      req.onsuccess = () => {
        if (req.result) {
          req.result.syncStatus = 'synced';
          store.put(req.result);
        }
      };
    } catch (err) {}
  }

  /** Sync pending matches to Firestore */
  static async syncPendingMatchesToFirestore(firestore: Firestore | null): Promise<boolean> {
    if (!firestore || typeof window === 'undefined' || !navigator.onLine) {
      return false;
    }

    const pending = await this.getPendingMatches();
    if (pending.length === 0) return true;

    let allSynced = true;

    for (const entry of pending) {
      try {
        const matchRef = doc(firestore, 'matches', entry.id);
        await setDoc(
          matchRef,
          {
            ...entry.matchData,
            syncedAt: serverTimestamp(),
          },
          { merge: true }
        );
        await this.markMatchSynced(entry.id);
      } catch (err) {
        console.error(`Error syncing match ${entry.id} to Firestore:`, err);
        allSynced = false;
      }
    }

    return allSynced;
  }
}

/**
 * Custom React Hook for Network Status & Offline Sync State
 */
export function useOfflineSync(firestore: Firestore | null) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>('synced');
  const [pendingCount, setPendingCount] = useState<number>(0);

  const checkPending = useCallback(async () => {
    const pending = await OfflineSyncService.getPendingMatches();
    setPendingCount(pending.length);
    if (!navigator.onLine) {
      setSyncStatus('offline');
    } else if (pending.length > 0) {
      setSyncStatus('pending');
    } else {
      setSyncStatus('synced');
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || !firestore) return;
    setSyncStatus('syncing');
    const success = await OfflineSyncService.syncPendingMatchesToFirestore(firestore);
    if (success) {
      setSyncStatus('synced');
      setPendingCount(0);
    } else {
      setSyncStatus('pending');
    }
  }, [firestore]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkPending, triggerSync]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    triggerSync,
    checkPending,
  };
}
