import { hasLocale } from 'next-intl';
import { messages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return new Response('Not found', { status: 404 });
  }

  return Response.json(
    {
      name: 'Billio',
      short_name: 'Billio',
      description: messages[locale].META.DESCRIPTION,
      lang: locale,
      id: '/',
      start_url: `/${locale}/`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#14b8a6',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
