import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OnboardingForm } from './OnboardingForm';

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const existingProfile = await getCurrentUser();
  if (existingProfile) redirect('/dashboard');

  const t = await getTranslations('onboarding');

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink-600">{t('subtitle')}</p>
        </div>
        <OnboardingForm defaultEmail={user.email ?? ''} />
      </div>
    </div>
  );
}
