import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPlayerClient } from './player-client';
import { CricNinjaUser } from '@/types/user';

interface Props {
  params: {
    username: string;
  };
}

/**
 * Demo fallback player profiles for public URLs
 */
const DEMO_PROFILES: Record<string, CricNinjaUser> = {
  rahul_smash: {
    uid: 'demo_rahul',
    email: 'rahul@cricninja.com',
    profileCompleted: true,
    onboardingStep: 9,
    profileCompletion: 100,
    createdAt: null,
    updatedAt: null,
    account: {
      displayName: 'Rahul Sharma',
      username: 'rahul_smash',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300',
      bio: 'Aggressive opening batter from Hyderabad. Scorer & local tournament captain.',
    },
    location: {
      countryId: 'IN',
      country: 'India',
      stateId: 'IN-TG',
      state: 'Telangana',
      cityId: 'IN-TG-HYD',
      city: 'Hyderabad',
    },
    cricket: {
      primaryRole: 'batter',
      batting: { hand: 'right', position: 'opener' },
      bowling: { arm: 'right', style: 'off_spin' },
      jerseyNumber: 18,
      favoriteFormats: ['T20', 'Tennis Ball', 'Box Cricket'],
    },
    social: { followers: 145, following: 32, verified: true },
    careerStats: {
      matches: 42,
      runs: 1280,
      wickets: 14,
      highestScore: 112,
      bestBowling: '3/18',
    },
    achievements: ['Local Legend', 'Centurion'],
    badges: ['Top Batter 2026'],
  },
  basheer: {
    uid: 'demo_basheer',
    email: 'basheer@cricninja.com',
    profileCompleted: true,
    onboardingStep: 9,
    profileCompletion: 100,
    createdAt: null,
    updatedAt: null,
    account: {
      displayName: 'Basheer Ahamad',
      username: 'basheer',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300',
      bio: 'CricNinja creator & lead all-rounder.',
    },
    location: {
      countryId: 'IN',
      country: 'India',
      stateId: 'IN-TG',
      state: 'Telangana',
      cityId: 'IN-TG-HYD',
      city: 'Hyderabad',
    },
    cricket: {
      primaryRole: 'all_rounder',
      batting: { hand: 'right', position: 'top_order' },
      bowling: { arm: 'right', style: 'fast' },
      jerseyNumber: 7,
      favoriteFormats: ['T20', 'ODI'],
    },
    social: { followers: 520, following: 12, verified: true },
    careerStats: {
      matches: 88,
      runs: 2450,
      wickets: 76,
      highestScore: 142,
      bestBowling: '5/18',
    },
    achievements: ['Master Scorer', 'MVP'],
    badges: ['CricNinja Admin'],
  },
};

/**
 * Dynamic SEO Metadata for Public Player Profiles
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username.toLowerCase();
  const player = DEMO_PROFILES[username] || {
    account: { displayName: `@${username}`, username },
  };

  const title = `${player.account?.displayName} (@${username}) | CricNinja Player Profile`;
  const description = `View ${player.account?.displayName}'s official cricket statistics, career runs, wickets, and local rankings on CricNinja.`;
  const canonicalUrl = `https://cricninja.com/player/${username}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'CricNinja',
      images: [
        {
          url: player.account?.photoURL || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&h=630',
          width: 1200,
          height: 630,
          alt: player.account?.displayName,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function PlayerProfilePage({ params }: Props) {
  const username = params.username.toLowerCase();
  const player = DEMO_PROFILES[username] || DEMO_PROFILES['rahul_smash'];

  if (!player) {
    notFound();
  }

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.account?.displayName,
    alternateName: player.account?.username,
    description: player.account?.bio,
    image: player.account?.photoURL,
    jobTitle: 'Cricket Player',
    address: {
      '@type': 'PostalAddress',
      addressLocality: player.location?.city,
      addressRegion: player.location?.state,
      addressCountry: player.location?.country,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicPlayerClient player={player} />
    </>
  );
}
