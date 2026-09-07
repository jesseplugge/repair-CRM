import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { SignupAcceptForm, JoinExistingSessionForm } from './AcceptInviteForm';
import { LogoutButton } from './LogoutButton';

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
  const t = await getTranslations('acceptInvite');
  const ROLE_LABELS: Record<string, string> = { owner: t('roleOwner'), employee: t('roleEmployee') };

  const { data: infoRows } = await supabase.rpc('get_invite_info', { p_token: params.token });
  const info = infoRows?.[0];

  if (!info || !info.valid) {
    return (
      <Shell title={t('titleDefault')}>
        <p className="text-sm text-ink-700">{t('invalidInvite')}</p>
      </Shell>
    );
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const inviteTitle = t('titleFor', { businessName: info.business_name, role: ROLE_LABELS[info.role] ?? info.role });

  if (!authUser) {
    return (
      <Shell title={inviteTitle}>
        <SignupAcceptForm token={params.token} email={info.email} />
      </Shell>
    );
  }

  if ((authUser.email ?? '').toLowerCase() !== info.email.toLowerCase()) {
    return (
      <Shell title={t('titleDefault')}>
        <p className="mb-4 text-sm text-ink-700">
          {t.rich('wrongAccount', {
            email: authUser.email ?? '',
            inviteEmail: info.email,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <LogoutButton />
      </Shell>
    );
  }

  const { data: existingProfile } = await supabase.from('users').select('id').eq('id', authUser.id).maybeSingle();
  if (existingProfile) {
    return (
      <Shell title={t('titleDefault')}>
        <p className="text-sm text-ink-700">{t('alreadyLinked')}</p>
      </Shell>
    );
  }

  return (
    <Shell title={inviteTitle}>
      <p className="mb-4 text-sm text-ink-600">
        {t.rich('loggedInAs', { email: authUser.email ?? '', strong: (chunks) => <strong>{chunks}</strong> })}
      </p>
      <JoinExistingSessionForm token={params.token} />
    </Shell>
  );
}
