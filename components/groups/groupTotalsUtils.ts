export function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function getMonthPeriod(now: Date, monthOffset: number) {
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end =
    monthOffset === 0
      ? now
      : new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, -1);

  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    label:
      monthOffset === 0
        ? 'This month'
        : new Intl.DateTimeFormat('en-GB', {
            month: 'long',
            year: 'numeric',
          }).format(start),
  };
}
