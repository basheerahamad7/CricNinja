"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, PlusCircle, User, Shield, Layers } from 'lucide-react';
import { useUser } from '@/firebase';

interface BottomNavigationProps {
  notificationsBadgeCount?: number;
}

export function BottomNavigation({ notificationsBadgeCount = 0 }: BottomNavigationProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Matches', href: '/matches', icon: Layers },
    { label: 'New Match', href: '/matches/create', icon: PlusCircle, isPrimary: true },
    { label: 'Rankings', href: '/leaderboard', icon: Trophy },
    { label: 'Profile', href: '/profile', icon: User, badge: notificationsBadgeCount },
  ];

  // Hide bottom nav during live scoring and onboarding steps
  if (pathname === '/onboarding' || (pathname.startsWith('/matches/') && pathname.endsWith('/scoring'))) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/80 px-3 pt-2 pb-safe select-none shadow-2xl transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div className="w-13 h-13 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-background group-hover:scale-105 group-active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-primary mt-1">New Match</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 focus:outline-none ${
                isActive 
                  ? 'text-primary font-black scale-105' 
                  : 'text-muted-foreground hover:text-foreground font-semibold'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-destructive text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] uppercase tracking-wider font-headline">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full absolute -bottom-0.5 animate-in zoom-in duration-200" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
