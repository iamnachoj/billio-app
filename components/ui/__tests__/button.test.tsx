import { describe, expect, it } from 'vitest';

import Button from '../Button';

describe('Button', () => {
  it('disables itself and shows a loading label while loading', () => {
    const element = Button({ loading: true, children: 'Save' });

    expect(element.props.disabled).toBe(true);
    expect(element.props.children).toBe('Loading...');
  });
});
