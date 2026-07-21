import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as userRepository from '@/lib/repositories/userRepository';
import * as passwordResetRepository from '@/lib/repositories/passwordResetRepository';
import bcrypt from 'bcryptjs';
import { requestPasswordReset, resetPassword } from './passwordResetService';
import { sendPasswordResetEmail } from './emailService';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/userRepository', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  updateUserPassword: vi.fn(),
}));

vi.mock('@/lib/repositories/passwordResetRepository', () => ({
  createPasswordResetToken: vi.fn(),
  cleanupExpiredPasswordResetTokens: vi.fn(),
  deletePasswordResetTokensForUser: vi.fn(),
  deletePasswordResetTokenById: vi.fn(),
  getPasswordResetTokenByToken: vi.fn(),
  getRecentPasswordResetRequests: vi.fn(),
}));

vi.mock('./emailService', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

describe('passwordResetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests a password reset for an existing user', async () => {
    vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hash',
    } as never);
    vi.mocked(passwordResetRepository.getRecentPasswordResetRequests).mockResolvedValue(0);

    const result = await requestPasswordReset('ana@example.com');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected reset request to succeed');
    }

    expect(passwordResetRepository.cleanupExpiredPasswordResetTokens).toHaveBeenCalled();
    expect(passwordResetRepository.deletePasswordResetTokensForUser).toHaveBeenCalledWith('user-1');
    expect(passwordResetRepository.createPasswordResetToken).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('ana@example.com', expect.any(String));
  });

  it('rejects a password reset request when the user is rate limited', async () => {
    vi.mocked(userRepository.getUserByEmail).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'hash',
    } as never);
    vi.mocked(passwordResetRepository.getRecentPasswordResetRequests).mockResolvedValue(2);

    const result = await requestPasswordReset('ana@example.com');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected rate limiting to block the request');
    }

    expect(result.error).toEqual({
      code: 'RATE_LIMITED',
      message: 'Too many password reset requests. Please try again later.',
      status: 429,
    });
  });

  it('resets a password when the token is valid', async () => {
    vi.mocked(passwordResetRepository.getPasswordResetTokenByToken).mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      token: 'token-123',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(userRepository.getUserById).mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'old-hash',
    } as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    const result = await resetPassword('token-123', 'newPassword123');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected password reset to succeed');
    }

    expect(userRepository.updateUserPassword).toHaveBeenCalledWith('user-1', 'new-hash');
    expect(passwordResetRepository.deletePasswordResetTokenById).toHaveBeenCalledWith('reset-1');
  });
});
