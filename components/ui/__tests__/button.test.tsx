import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    key === 'LOADING' ? 'Loading...' : key,
}));

import Button from '../Button';

describe('Button', () => {
  it('disables itself and shows a loading label while loading', () => {
    const element = Button({ loading: true, children: 'Save' });

    expect(element.props.disabled).toBe(true);
    expect(element.props.children).toBe('Loading...');
  });
});
