import { describe, expect, it } from 'vitest';

import { applyGroupOrder, parseGroupOrder } from '../groupOrder';

describe('parseGroupOrder', () => {
  it('parses a URL-encoded JSON array of ids', () => {
    const raw = encodeURIComponent(JSON.stringify(['b', 'a']));
    expect(parseGroupOrder(raw)).toEqual(['b', 'a']);
  });

  it('returns empty array for missing or invalid values', () => {
    expect(parseGroupOrder(undefined)).toEqual([]);
    expect(parseGroupOrder('not-json')).toEqual([]);
    expect(parseGroupOrder(encodeURIComponent('{"foo":1}'))).toEqual([]);
  });

  it('filters out non-string entries', () => {
    const raw = encodeURIComponent(JSON.stringify(['a', 42, null, 'b']));
    expect(parseGroupOrder(raw)).toEqual(['a', 'b']);
  });
});

describe('applyGroupOrder', () => {
  const groups = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('sorts groups by the stored order', () => {
    expect(applyGroupOrder(groups, ['c', 'a', 'b']).map((g) => g.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('appends groups missing from the stored order at the end', () => {
    expect(applyGroupOrder(groups, ['c']).map((g) => g.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('ignores stored ids that no longer exist', () => {
    expect(
      applyGroupOrder(groups, ['deleted', 'b', 'a']).map((g) => g.id)
    ).toEqual(['b', 'a', 'c']);
  });

  it('returns the original order when no order is stored', () => {
    expect(applyGroupOrder(groups, []).map((g) => g.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('does not mutate the input array', () => {
    applyGroupOrder(groups, ['c', 'a', 'b']);
    expect(groups.map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });
});
