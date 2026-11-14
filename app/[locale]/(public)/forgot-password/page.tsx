import ForgotPassword from '@/components/auth/ForgotPassword';
import { publicAlternates } from '@/i18n/metadata';

export const metadata = { alternates: publicAlternates('/forgot-password') };

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
