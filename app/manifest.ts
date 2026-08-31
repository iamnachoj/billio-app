import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Billio',
    short_name: 'Billio',
    description:
      'Track shared expenses, settle balances and manage group finances effortlessly.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#14b8a6',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
