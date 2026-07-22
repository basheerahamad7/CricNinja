export type PrimaryRole = 'batter' | 'bowler' | 'all_rounder' | 'keeper';
export type BattingHand = 'right' | 'left';
export type BattingPosition = 'opener' | 'top_order' | 'middle_order' | 'finisher';
export type BowlingArm = 'right' | 'left';
export type BowlingStyle = 
  | 'fast' 
  | 'fast_medium' 
  | 'medium_pace' 
  | 'off_spin' 
  | 'leg_spin' 
  | 'left_arm_orthodox' 
  | 'left_arm_chinaman';

export type Specialization = 'batting_all_rounder' | 'balanced' | 'bowling_all_rounder';

export interface UserLocation {
  countryId: string;
  country: string;
  stateId: string;
  state: string;
  cityId: string;
  city: string;
  cityKey?: string;
  stateKey?: string;
  countryKey?: string;
}

export interface CricNinjaUser {
  uid: string;
  email: string;
  profileCompleted: boolean;
  onboardingStep: number; // 1 through 9
  profileCompletion: number; // 0 to 100
  createdAt: any;
  updatedAt: any;

  account: {
    displayName: string;
    username: string;
    photoURL: string;
    bio: string;
  };

  location: UserLocation;

  cricket: {
    primaryRole: PrimaryRole | null;
    batting: {
      hand: BattingHand | null;
      position: BattingPosition | null;
    };
    bowling: {
      arm: BowlingArm | null;
      style: BowlingStyle | string | null;
    };
    specialization?: Specialization | string | null;
    jerseyNumber: number | null;
    favoriteFormats: string[];
  };

  social: {
    followers: number;
    following: number;
    verified: boolean;
  };

  progression: {
    level: number;
    xp: number;
  };

  careerStats: {
    matches: number;
    runs: number;
    wickets: number;
    highestScore: number;
    bestBowling: string;
  } | null;

  achievements: string[];
  badges: string[];
}

export function normalizeLocationKey(value: string): string {
  return value ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}
