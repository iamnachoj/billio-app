import { describe, expect, it } from 'vitest';

import { getMonthPeriod } from '../groupTotalsUtils';

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
