import { describe, expect, it } from 'vitest';
import { messages } from '../messages';

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
    return typeof child === 'string' ? [path] : keys(child, path);
  });
}

function entries(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof child === 'string'
        ? [[path, child]]
        : Object.entries(entries(child, path));
    })
  );
}

function placeholders(message: string) {
  return [
    ...new Set([
      ...Array.from(
        message.matchAll(/\{([A-Za-z_]\w*)\s*(?=[},])/g),
        (match) => match[1]
      ),
      ...Array.from(message.matchAll(/<([A-Za-z]\w*)>/g), (match) => match[1]),
    ]),
  ].sort();
}

describe('locale messages', () => {
  it('uses matching uppercase keys for every locale', () => {
    expect(keys(messages.es).sort()).toEqual(keys(messages.en).sort());
    expect(keys(messages.fr).sort()).toEqual(keys(messages.en).sort());
  });

  it('uses the same interpolation variables and rich-text tags in each locale', () => {
    const english = entries(messages.en);
    const spanish = entries(messages.es);
    const french = entries(messages.fr);
    for (const [key, message] of Object.entries(english)) {
      expect(placeholders(spanish[key]), key).toEqual(placeholders(message));
      expect(placeholders(french[key]), key).toEqual(placeholders(message));
    }
  });
});
