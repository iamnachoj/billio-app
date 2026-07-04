import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import {
  createPasswordResetToken,
  deletePasswordResetTokensForUser,
  getPasswordResetTokenByToken,
  getRecentPasswordResetRequests,
  markPasswordResetTokenAsUsed,
} from '@/lib/repositories/passwordResetRepository';
import { getUserByEmail, getUserById, updateUserPassword } from '@/lib/repositories/userRepository';
import { sendPasswordResetEmail } from './emailService';

export type PasswordResetResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

export async function requestPasswordReset(email: string): Promise<PasswordResetResult<{ sent: true }>> {
  if (!email) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Email is required',
        status: 400,
      },
    };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return {
      ok: true,
      data: { sent: true },
    };
  }

  const recentRequests = await getRecentPasswordResetRequests(user.id, 60_000);

  if (recentRequests >= 2) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many password reset requests. Please try again later.',
        status: 429,
      },
    };
  }

  await deletePasswordResetTokensForUser(user.id);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();

  await createPasswordResetToken({
    userId: user.id,
    token,
    expiresAt,
  });

  await sendPasswordResetEmail(user.email, token);

  return {
    ok: true,
    data: { sent: true },
  };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetResult<{ reset: true }>> {
  if (!token || !newPassword) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Token and new password are required',
        status: 400,
      },
    };
  }

  if (newPassword.length < 6) {
    return {
      ok: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters',
        status: 400,
      },
    };
  }

  const resetRecord = await getPasswordResetTokenByToken(token);

  if (!resetRecord) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired password reset token',
        status: 400,
      },
    };
  }

  if (resetRecord.usedAt) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Password reset token has already been used',
        status: 400,
      },
    };
  }

  if (resetRecord.expiresAt < new Date()) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Password reset token has expired',
        status: 400,
      },
    };
  }

  const user = await getUserById(resetRecord.userId);

  if (!user) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
        status: 404,
      },
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await updateUserPassword(user.id, passwordHash);
  await markPasswordResetTokenAsUsed(resetRecord.id);

  return {
    ok: true,
    data: { reset: true },
  };
}
