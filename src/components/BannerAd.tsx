
"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets } from 'lucide-react';

interface BannerAdProps {
  className?: string;
  slotId?: string; 
  adUnitId?: string; 
}

export function BannerAd({ className, slotId, adUnitId }: BannerAdProps) {
  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        // Silent catch
      }
    }
  }, []);

  return (
    <Card className={`relative overflow-hidden border-none bg-gradient-to-br from-amber-950 via-amber-700 to-amber-950 text-amber-50 shadow-2xl rounded-3xl min-h-[100px] flex flex-col justify-center ${className}`}>
      <div className="w-full flex justify-center">
        {ADSENSE_ID ? (
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client={`ca-${ADSENSE_ID}`}
               data-ad-slot={slotId || "YOUR_DEFAULT_SLOT_ID"}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        ) : (
          <a 
            href="https://esencia.framer.website/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-4 flex items-center justify-between w-full hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-400/20 p-2.5 rounded-2xl backdrop-blur-md ring-1 ring-amber-400/30">
                <Droplets className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.2em]">SPONSORED</p>
                <h4 className="text-sm font-black text-amber-100">Esencia Hair Oil</h4>
                <p className="text-[10px] text-amber-200/70 font-medium leading-tight">Premium oil for stronger, healthier hair. Shop now.</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] border-amber-400/40 text-amber-400 font-black h-6 tracking-widest bg-amber-950/40">AD</Badge>
          </a>
        )}
      </div>
      
      {!ADSENSE_ID && (
        <div className="absolute right-[-15px] bottom-[-15px] opacity-10 pointer-events-none">
          <Droplets className="w-20 h-20 rotate-12 text-amber-400" />
        </div>
      )}
    </Card>
  );
}
