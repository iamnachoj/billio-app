import { describe, expect, it } from 'vitest';

import {
  formatGroupDate,
  formatGroupNumber,
  formatMoney,
  getGroupCategoryLabel,
  getMonthPeriod,
} from '../groupTotalsUtils';

describe('getMonthPeriod', () => {
  it('uses the local start of the current month through the current instant', () => {
    const now = new Date(2026, 10, 14, 11, 44, 30, 123);
    const period = getMonthPeriod(now, 0);

    expect(period).toEqual({
      dateFrom: new Date(2026, 10, 1).toISOString(),
      dateTo: now.toISOString(),
      label: 'This month',
    });
  });

  it('includes the entire previous month across a year boundary', () => {
    const period = getMonthPeriod(new Date(2026, 0, 31, 12), -1);

    expect(period).toEqual({
      dateFrom: new Date(2025, 11, 1).toISOString(),
      dateTo: new Date(new Date(2026, 0, 1).getTime() - 1).toISOString(),
      label: 'December 2025',
    });
  });

  describe('group locale formatters', () => {
    it('formats the current month label and date in the active locale', () => {
      const now = new Date(2026, 10, 14, 11, 44);
      const currentPeriod = getMonthPeriod(now, 0, 'es', 'Este mes');
      const previousPeriod = getMonthPeriod(now, -1, 'es', 'Este mes');

      expect(currentPeriod.label).toBe('Este mes');
      expect(previousPeriod.label).toBe('octubre de 2026');
      expect(formatGroupDate(now, 'es', { dateStyle: 'medium' })).toContain(
        'nov'
      );
    });

    it('formats currency using the selected locale', () => {
      expect(formatMoney(123456, 'EUR', 'es')).toBe(
        new Intl.NumberFormat('es', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(1234.56)
      );
    });

    it('formats decimal values using the selected locale', () => {
      expect(formatGroupNumber(12.34, 'es')).toBe('12,34');
    });

    it('translates known expense categories and keeps legacy labels readable', () => {
      const translate = (key: string) => `translated:${key}`;

      expect(getGroupCategoryLabel('eating_out', translate)).toBe(
        'translated:CATEGORIES.EATING_OUT'
      );
      expect(getGroupCategoryLabel('legacy_category', translate)).toBe(
        'Legacy Category'
      );
    });
  });

  it('includes leap day and excludes the start of the next month', () => {
    const period = getMonthPeriod(new Date(2024, 2, 31), -1);

    expect(period.dateFrom).toBe(new Date(2024, 1, 1).toISOString());
    expect(period.dateTo).toBe(
      new Date(new Date(2024, 2, 1).getTime() - 1).toISOString()
    );
    expect(period.label).toBe('February 2024');
  });

  it('uses each local boundary independently across daylight saving changes', () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'Europe/Madrid';

    try {
      const period = getMonthPeriod(new Date(2026, 3, 15), -1);
      expect(period.dateFrom).toBe('2026-02-28T23:00:00.000Z');
      expect(period.dateTo).toBe('2026-03-31T21:59:59.999Z');
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });
});
