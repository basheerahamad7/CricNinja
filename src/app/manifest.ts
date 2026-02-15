import { MetadataRoute } from 'next'

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const cricketBatIcon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏏</text></svg>`;

  return {
    name: 'CricNinja',
    short_name: 'CricNinja',
    description: 'Pro scoring app for local cricket teams',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4285F4',
    icons: [
      {
        src: cricketBatIcon,
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: cricketBatIcon,
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
  }
}
