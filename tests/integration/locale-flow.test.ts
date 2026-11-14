import { describe, expect, it } from 'vitest';

import { getUserById } from '../../lib/repositories/userRepository';
import {
  loginUser,
  registerUser,
  updateUserAccount,
} from '../../lib/services/authService';

describe('locale persistence', () => {
  it('persists registration, login and profile preferences', async () => {
    const registered = await registerUser({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret123',
      locale: 'es',
    });
    if (!registered.ok) throw new Error('Registration failed');
    const id = registered.data.user.id;
    expect((await getUserById(id))?.locale).toBe('es');

    const login = await loginUser({
      email: 'ana@example.com',
      password: 'secret123',
      locale: 'en',
    });
    expect(login.ok).toBe(true);
    expect((await getUserById(id))?.locale).toBe('en');

    const update = await updateUserAccount(id, { locale: 'es' });
    expect(update.ok).toBe(true);
    expect((await getUserById(id))?.locale).toBe('es');
  });
});
