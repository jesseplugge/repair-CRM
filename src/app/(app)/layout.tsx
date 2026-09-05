import { redirect } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Sidebar } from './Sidebar';
import { buildAccentTokens } from '@/lib/utils/color';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/onboarding');

  const supabase = createClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('accent_color, logo_url, trading_name, legal_name')
    .eq('id', user.business_id)
    .single();

  const accentStyle = buildAccentTokens(business?.accent_color || '#0C7C82');

  return (
    <div className="flex min-h-screen" style={accentStyle as React.CSSProperties}>
      <Sidebar
        userName={user.full_name}
        logoUrl={business?.logo_url ?? null}
        businessName={business?.trading_name || business?.legal_name || 'Reparatie CRM'}
      />
      <main className="flex-1 bg-ink-50 p-6 lg:p-8">{children}</main>
    </div>
  );
}
