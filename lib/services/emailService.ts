import { Resend } from 'resend';
import { resolveLocale, type AppLocale } from '@/lib/locale';

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  requestedLocale?: AppLocale
) {
  const locale = resolveLocale(requestedLocale);
  const resetLink = `${(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
  const text =
    locale === 'es'
      ? {
          subject: 'Restablece tu contraseña',
          greeting: 'Hola,',
          instructions:
            'Has solicitado restablecer tu contraseña. Haz clic en el enlace para crear una nueva:',
          ignore: 'Si no lo has solicitado, puedes ignorar este correo.',
        }
      : {
          subject: 'Reset your password',
          greeting: 'Hello,',
          instructions:
            'You requested a password reset. Click the link below to set a new password:',
          ignore: 'If you did not request this, you can ignore this email.',
        };
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey) {
    console.warn(
      '[password-reset] RESEND_API_KEY is not configured; skipping email send.'
    );
    console.log(`[password-reset] reset link for ${email}: ${resetLink}`);
    return;
  }

  const resend = new Resend(resendApiKey);

  try {
    console.log(`[password-reset] sending to ${email}`);

    const response = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: text.subject,
      html: `
        <p>${text.greeting}</p>
        <p>${text.instructions}</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>${text.ignore}</p>
      `,
    });

    console.log('[password-reset] email sent successfully', response);
    return response;
  } catch (error) {
    console.error('[password-reset] email send failed', error);
    throw error;
  }
}
