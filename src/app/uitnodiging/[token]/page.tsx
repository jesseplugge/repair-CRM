import { createClient } from '@/lib/supabase/server';
import { SignupAcceptForm, JoinExistingSessionForm } from './AcceptInviteForm';
import { LogoutButton } from './LogoutButton';

const ROLE_LABELS: Record<string, string> = { owner: 'Eigenaar', employee: 'Medewerker' };

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 font-display text-2xl font-semibold text-white">Reparatie CRM</div>
          <p className="text-sm text-ink-400">{title}</p>
        </div>
        <div className="rounded-lg border border-ink-800 bg-white p-6 shadow-card">{children}</div>
      </div>
    </div>
  );
}

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient();

  const { data: infoRows } = await supabase.rpc('get_invite_info', { p_token: params.token });
  const info = infoRows?.[0];

  if (!info || !info.valid) {
    return (
      <Shell title="Uitnodiging">
        <p className="text-sm text-ink-700">
          Deze uitnodiging is ongeldig, al gebruikt of verlopen. Vraag de eigenaar om een nieuwe uitnodiging te
          sturen.
        </p>
      </Shell>
    );
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return (
      <Shell title={`Uitnodiging voor ${info.business_name} (${ROLE_LABELS[info.role] ?? info.role})`}>
        <SignupAcceptForm token={params.token} email={info.email} />
      </Shell>
    );
  }

  if ((authUser.email ?? '').toLowerCase() !== info.email.toLowerCase()) {
    return (
      <Shell title="Uitnodiging">
        <p className="mb-4 text-sm text-ink-700">
          Je bent ingelogd als <strong>{authUser.email}</strong>, maar deze uitnodiging is voor{' '}
          <strong>{info.email}</strong>. Log uit en volg de link opnieuw met het juiste account.
        </p>
        <LogoutButton />
      </Shell>
    );
  }

  const { data: existingProfile } = await supabase.from('users').select('id').eq('id', authUser.id).maybeSingle();
  if (existingProfile) {
    return (
      <Shell title="Uitnodiging">
        <p className="text-sm text-ink-700">Dit account is al aan een bedrijf gekoppeld.</p>
      </Shell>
    );
  }

  return (
    <Shell title={`Uitnodiging voor ${info.business_name} (${ROLE_LABELS[info.role] ?? info.role})`}>
      <p className="mb-4 text-sm text-ink-600">
        Ingelogd als <strong>{authUser.email}</strong>. Vul je naam in om je aan te sluiten.
      </p>
      <JoinExistingSessionForm token={params.token} />
    </Shell>
  );
}
