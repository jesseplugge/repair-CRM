'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/primitives';

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations('acceptInvite');

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" onClick={handleLogout}>
      {t('logout')}
    </Button>
  );
}
