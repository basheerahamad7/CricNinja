
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Player = {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  isOut: boolean;
  dotsFace: number;
  maidens: number;
  dotsBowled: number;
  widesConceded: number;
  noBallsConceded: number;
  howOut?: string;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type ExtraType = 'wide' | 'noBall' | 'bye' | 'legBye' | 'penalty';
export type WicketType = 
  | 'bowled' 
  | 'caught' 
  | 'lbw' 
  | 'runOut' 
  | 'stumped' 
  | 'hitWicket' 
  | 'retired';

export type BallRecord = {
  runs: number;
  isExtra: boolean;
  extraType?: ExtraType;
  isWicket: boolean;
  wicketType?: WicketType;
  batsmanId: string;
  bowlerId: string;
};

export type OverRecord = {
  bowlerId: string;
  balls: BallRecord[];
};

export type Match = {
  id: string;
  ownerId?: string;
  teamA: Team;
  teamB: Team;
  totalOvers: number;
  currentInnings: 1 | 2;
  status: 'ongoing' | 'completed';
  venue?: string;
  series?: string;
  umpires?: string[];
  innings1: {
    battingTeamId: string;
    totalRuns: number;
    totalWickets: number;
    totalBalls: number;
    overs: OverRecord[];
  };
  innings2: {
    battingTeamId: string;
    totalRuns: number;
    totalWickets: number;
    totalBalls: number;
    overs: OverRecord[];
  };
  currentStrikerId: string | null;
  currentNonStrikerId: string | null;
  currentBowlerId: string | null;
  timestamp: number;
  history?: string[];
};

interface MatchStore {
  matches: Match[];
  joinedMatches: Record<string, Match>; // Cache for spectator matches
  joinedMatchIds: string[];
  addMatch: (match: Match) => void;
  joinMatch: (id: string) => void;
  updateMatch: (updatedMatch: Match, saveToHistory?: boolean) => void;
  updateJoinedMatch: (id: string, data: Match) => void; // For spectators
  undoMatchAction: (id: string) => void;
  deleteMatch: (id: string) => void;
}

export const useMatchStore = create<MatchStore>()(
  persist(
    (set) => ({
      matches: [],
      joinedMatches: {},
      joinedMatchIds: [],
      addMatch: (match) => set((state) => {
        const newMatches = [match, ...state.matches].slice(0, 15);
        return { matches: newMatches };
      }),
      joinMatch: (id) => set((state) => {
        const filtered = state.joinedMatchIds.filter(mid => mid !== id);
        return { joinedMatchIds: [id, ...filtered].slice(0, 10) };
      }),
      updateMatch: (updatedMatch, saveToHistory = true) =>
        set((state) => {
          const oldMatch = state.matches.find(m => m.id === updatedMatch.id);
          const history = oldMatch?.history || [];
          
          let newHistory = history;
          if (saveToHistory && oldMatch) {
            const { history: _, ...stateToSave } = oldMatch;
            newHistory = [JSON.stringify(stateToSave), ...history].slice(0, 20);
          }

          const updatedMatches = state.matches.map((m) => 
            m.id === updatedMatch.id ? { ...updatedMatch, history: newHistory } : m
          );

          return { matches: updatedMatches };
        }),
      updateJoinedMatch: (id, data) => set((state) => ({
        joinedMatches: { ...state.joinedMatches, [id]: data }
      })),
      undoMatchAction: (id) => set((state) => {
        const match = state.matches.find(m => m.id === id);
        if (!match || !match.history || match.history.length === 0) return state;

        const [prevStateStr, ...remainingHistory] = match.history;
        const prevState = JSON.parse(prevStateStr) as Match;
        
        return {
          matches: state.matches.map(m => 
            m.id === id ? { ...prevState, history: remainingHistory } : m
          )
        };
      }),
      deleteMatch: (id) =>
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
          joinedMatchIds: state.joinedMatchIds.filter(mid => mid !== id),
          joinedMatches: Object.fromEntries(
            Object.entries(state.joinedMatches).filter(([k]) => k !== id)
          )
        })),
    }),
    { 
      name: 'cricninja-v5-store',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  )
);
