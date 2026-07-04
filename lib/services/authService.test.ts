import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as userRepository from '@/lib/repositories/userRepository';
import bcrypt from 'bcryptjs';
import { deleteUserAccount, getCurrentUser, loginUser, registerUser } from './authService';
import { cookies } from 'next/headers';
import { generateToken, verifyToken } from '@/lib/utils/jwt';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/userRepository', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUserByEmail: vi.fn(),
  deleteUserById: vi.fn(),
}));

vi.mock('@/lib/utils/jwt', () => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a new user with a hashed password', async () => {
    vi.mocked(userRepository.getUserByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(userRepository.createUserByEmail).mockResolvedValue({
      id: '123-123-123-123-123',
      name: 'Ana',
      email: 'ana@example.com',
    });

    const result = await registerUser({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected registration to succeed');
    }

    expect(result.data.user).toEqual({
      id: '123-123-123-123-123',
      name: 'Ana',
      email: 'ana@example.com',
    });
    expect(userRepository.createUserByEmail).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hashed-password',
    });
  });

  it('logs in an existing user and returns a token', async () => {
    vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hashed-password',
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(generateToken).mockReturnValue('jwt-token');

    const result = await loginUser({
      email: 'ana@example.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected login to succeed');
    }

    expect(result.data).toEqual({
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
      },
      token: 'jwt-token',
    });
  });

  it('returns the current user from a valid token', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-value' }),
    } as never);
    vi.mocked(verifyToken).mockReturnValue({ userId: 'user-1', iat: 1, exp: 2 } as never);
    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hashed-password',
    } as never);

    const result = await getCurrentUser();

    expect(result).toEqual({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
    });
  });

  it('deletes the authenticated user when the target matches the current user', async () => {
    vi.mocked(userRepository.deleteUserById).mockResolvedValue(true);

    const result = await deleteUserAccount('user-1', 'user-1');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected deletion to succeed');
    }

    expect(result.data).toEqual({ deleted: true });
    expect(userRepository.deleteUserById).toHaveBeenCalledWith('user-1');
  });

  it('does not allow deleting another user', async () => {
    const result = await deleteUserAccount('user-1', 'user-2');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected deletion to be forbidden');
    }

    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'You can only delete your own account',
      status: 403,
    });
  });
});
