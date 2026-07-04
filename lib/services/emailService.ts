import { Resend } from 'resend';

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey) {
    console.warn('[password-reset] RESEND_API_KEY is not configured; skipping email send.');
    console.log(`[password-reset] reset link for ${email}: ${resetLink}`);
    return;
  }

  const resend = new Resend(resendApiKey);

  try {
    console.log(`[password-reset] sending to ${email}`);

    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    console.log('[password-reset] email sent successfully', response);
    return response;
  } catch (error) {
    console.error('[password-reset] email send failed', error);
    throw error;
  }
}
