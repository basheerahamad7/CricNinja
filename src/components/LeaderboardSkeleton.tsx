"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function LeaderboardSkeleton() {
  return (
    <Card className="border-border bg-card shadow-xl rounded-3xl overflow-hidden p-2">
      <CardContent className="p-2 space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="w-10 h-10 rounded-full bg-muted-foreground/20 shrink-0" />
              <div className="space-y-1.5">
                <div className="w-28 h-3.5 bg-muted-foreground/20 rounded-md" />
                <div className="w-20 h-2.5 bg-muted-foreground/10 rounded-md" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <div className="w-14 h-3.5 bg-muted-foreground/20 rounded-md ml-auto" />
              <div className="w-10 h-2.5 bg-muted-foreground/10 rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
