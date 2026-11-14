import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const negotiateLocale = createMiddleware(routing);

export function GET(request: NextRequest) {
  return negotiateLocale(request);
}
