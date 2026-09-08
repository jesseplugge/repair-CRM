import { redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { AppShell } from './AppShell';
import { TopBar } from './TopBar';
import { buildAccentTokens } from '@/lib/utils/color';
import { getNotifications } from '@/lib/actions/notifications';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/onboarding');

  const supabase = createClient();
  const [{ data: business }, notifications] = await Promise.all([
    supabase.from('businesses').select('accent_color, logo_url, trading_name, legal_name').eq('id', user.business_id).single(),
    getNotifications(),
  ]);

  const accentStyle = buildAccentTokens(business?.accent_color || '#0C7C82');

  return (
    <AppShell
      style={accentStyle as React.CSSProperties}
      sidebarProps={{
        userName: user.full_name,
        logoUrl: business?.logo_url ?? null,
        businessName: business?.trading_name || business?.legal_name || 'Reparatie CRM',
      }}
    >
      <TopBar notifications={notifications} />
      {children}
    </AppShell>
  );
}
