import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: sendMock,
    };
  },
}));

import { sendPasswordResetEmail } from './emailService';

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('logs the reset link when the resend API key is not configured', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await sendPasswordResetEmail('user@example.com', 'token-123');

    expect(consoleWarnSpy).toHaveBeenCalledWith('[password-reset] RESEND_API_KEY is not configured; skipping email send.');
    expect(consoleLogSpy).toHaveBeenCalledWith('[password-reset] reset link for user@example.com: http://localhost:3000/reset-password?token=token-123');
  });

  it('sends an email through resend when the API key is configured', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'noreply@example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://billio.app';
    sendMock.mockResolvedValue({ id: 'email-1' });

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await sendPasswordResetEmail('user@example.com', 'token-123');

    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'user@example.com',
      subject: 'Reset your password',
      html: expect.stringContaining('https://billio.app/reset-password?token=token-123'),
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('[password-reset] sending to user@example.com');
    expect(consoleLogSpy).toHaveBeenCalledWith('[password-reset] email sent successfully', { id: 'email-1' });
  });
});
