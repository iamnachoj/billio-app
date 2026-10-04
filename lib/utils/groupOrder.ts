export const GROUP_ORDER_COOKIE = 'billio-group-order';

// The cookie stores a URL-encoded JSON array of group ids.
export function parseGroupOrder(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

// Sorts groups by the stored order. Groups missing from the order
// (e.g. newly created) keep their relative order and go at the end.
export function applyGroupOrder<T extends { id: string }>(
  groups: T[],
  order: string[]
): T[] {
  if (order.length === 0) return groups;
  const position = new Map(order.map((id, index) => [id, index]));
  return [...groups].sort(
    (a, b) =>
      (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (position.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
}
