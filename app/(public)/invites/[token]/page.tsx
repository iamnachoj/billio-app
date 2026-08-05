import InviteAcceptanceCard from '@/components/invites/InviteAcceptanceCard';
import { getCurrentUser } from '@/lib/services/authService';
import { getInviteByToken } from '@/lib/services/inviteService';

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const [inviteResult, currentUser] = await Promise.all([
    getInviteByToken(token),
    getCurrentUser(),
  ]);

  if (!inviteResult.ok) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-600">
            Invite unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            This invite cannot be used
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {inviteResult.error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <InviteAcceptanceCard
      token={token}
      preview={inviteResult.data}
      currentUser={
        currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
            }
          : null
      }
    />
  );
}
