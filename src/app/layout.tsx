
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';

const cricketBatIcon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏏</text></svg>`;
const shareImage = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&h=630&auto=format&fit=crop';

export const metadata: Metadata = {
  title: 'CricNinja | Live Cricket Scoring & Pro Match Stats',
  description: 'Track every ball, share live scores, and manage your local cricket team like a pro with CricNinja. Optimized for local leagues and fast scoring.',
  keywords: ['cricket scoring app', 'local cricket', 'live scores', 'cricket stats', 'CricNinja', 'scorecard'],
  icons: {
    icon: [{ url: cricketBatIcon, type: 'image/svg+xml' }],
    apple: [{ url: cricketBatIcon }],
  },
  openGraph: {
    title: 'CricNinja | Pro Live Cricket Scoring',
    description: 'Real-time updates, player statistics, and instant live sharing for local teams.',
    url: 'https://cricninja.com',
    siteName: 'CricNinja',
    images: [{ url: shareImage, width: 1200, height: 630, alt: 'CricNinja Live Scoring' }],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#4285F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-body antialiased bg-background safe-paddings">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
