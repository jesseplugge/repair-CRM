import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { BusinessForm } from './BusinessForm';
import { CatalogManager } from './CatalogManager';
import { TermsManager } from './TermsManager';
import { StatusManager } from './StatusManager';
import { LogoUploader } from './LogoUploader';
import { AccentColorPicker } from './AccentColorPicker';
import { UserInviteManager } from './UserInviteManager';
import { TemplateManager } from './TemplateManager';
import { getTemplateContent, TEMPLATE_TYPES } from '@/lib/pdf/templates';

export default async function InstellingenPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('settingsPage');

  const [{ data: business }, { data: catalog }, { data: statuses }, { data: terms }, { data: businessUsers }, { data: invites }, templateEntries] =
    await Promise.all([
      supabase.from('businesses').select('*').eq('id', user!.business_id).single(),
      supabase.from('catalog_repair_types').select('*').eq('business_id', user!.business_id).order('name'),
      supabase.from('repair_statuses').select('*').eq('business_id', user!.business_id).order('sort_order'),
      supabase.from('terms_versions').select('*').eq('business_id', user!.business_id).order('effective_date', { ascending: false }),
      supabase.from('users').select('*').eq('business_id', user!.business_id).order('created_at'),
      supabase
        .from('invites')
        .select('*')
        .eq('business_id', user!.business_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at'),
      Promise.all(TEMPLATE_TYPES.map((type) => getTemplateContent(user!.business_id, type))),
    ]);

  const templates = Object.fromEntries(TEMPLATE_TYPES.map((type, i) => [type, templateEntries[i]])) as Record<
    (typeof TEMPLATE_TYPES)[number],
    Record<string, string>
  >;

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
        <p className="text-sm text-ink-600">{t('subtitle')}</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('brandingSection')}</h2>
        <div className="space-y-4 rounded-lg border border-ink-100 bg-white p-5 shadow-card">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-900">{t('logo')}</p>
            <LogoUploader currentLogoUrl={business!.logo_url} />
          </div>
          <div className="border-t border-ink-100 pt-4">
            <p className="mb-2 text-sm font-medium text-ink-900">{t('accentColor')}</p>
            <AccentColorPicker businessId={business!.id} currentColor={business!.accent_color} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('businessSection')}</h2>
        <BusinessForm business={business!} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('catalogSection')}</h2>
        <p className="mb-3 text-sm text-ink-600">{t('catalogSubtitle')}</p>
        <CatalogManager items={catalog ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('termsSection')}</h2>
        <p className="mb-3 text-sm text-ink-600">{t('termsSubtitle')}</p>
        <TermsManager versions={terms ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('statusesSection')}</h2>
        <StatusManager statuses={statuses ?? []} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('usersSection')}</h2>
        <UserInviteManager
          members={businessUsers ?? []}
          invites={invites ?? []}
          canInvite={user!.role === 'owner'}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('templatesSection')}</h2>
        <p className="mb-3 text-sm text-ink-600">{t('templatesSubtitle')}</p>
        <TemplateManager templates={templates} canEdit={user!.role === 'owner'} />
      </section>
    </div>
  );
}
