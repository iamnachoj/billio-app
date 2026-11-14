import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import enErrors from '@/messages/en/ERRORS.json';

type ApiError = { code: string; message: string };
type ErrorCode = keyof typeof enErrors;

export function errorKey(code: string): ErrorCode {
  return Object.prototype.hasOwnProperty.call(enErrors, code)
    ? (code as ErrorCode)
    : 'UNKNOWN';
}

export function useApiError() {
  const t = useTranslations('ERRORS');
  return useCallback((error: ApiError) => t(errorKey(error.code)), [t]);
}
