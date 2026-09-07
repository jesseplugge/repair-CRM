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
import { CategoryManager } from './CategoryManager';
import { SupplierManager } from './SupplierManager';
import { getTemplateContent, TEMPLATE_TYPES } from '@/lib/pdf/templates';
import { SettingsShell } from './SettingsShell';

export default async function InstellingenPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('settingsPage');

  const [
    { data: business },
    { data: catalog },
    { data: statuses },
    { data: terms },
    { data: businessUsers },
    { data: invites },
    templateEntries,
    { data: categories },
    { data: suppliers },
    { data: productLinks },
  ] = await Promise.all([
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
    supabase.from('product_categories').select('*').eq('business_id', user!.business_id).order('name'),
    supabase.from('suppliers').select('*').eq('business_id', user!.business_id).order('name'),
    supabase.from('products').select('category_id, supplier_id').eq('business_id', user!.business_id),
  ]);

  const categoryCounts = new Map<string, number>();
  const supplierCounts = new Map<string, number>();
  for (const p of productLinks ?? []) {
    if (p.category_id) categoryCounts.set(p.category_id, (categoryCounts.get(p.category_id) ?? 0) + 1);
    if (p.supplier_id) supplierCounts.set(p.supplier_id, (supplierCounts.get(p.supplier_id) ?? 0) + 1);
  }

  const templates = Object.fromEntries(TEMPLATE_TYPES.map((type, i) => [type, templateEntries[i]])) as Record<
    (typeof TEMPLATE_TYPES)[number],
    Record<string, string>
  >;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
        <p className="text-sm text-ink-600">{t('subtitle')}</p>
      </div>

      <SettingsShell
        categories={[
          {
            key: 'branding',
            label: t('brandingSection'),
            content: (
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
            ),
          },
          { key: 'business', label: t('businessSection'), content: <BusinessForm business={business!} /> },
          {
            key: 'catalog',
            label: t('catalogSection'),
            content: (
              <div>
                <p className="mb-3 text-sm text-ink-600">{t('catalogSubtitle')}</p>
                <CatalogManager items={catalog ?? []} />
              </div>
            ),
          },
          {
            key: 'terms',
            label: t('termsSection'),
            content: (
              <div>
                <p className="mb-3 text-sm text-ink-600">{t('termsSubtitle')}</p>
                <TermsManager versions={terms ?? []} />
              </div>
            ),
          },
          { key: 'statuses', label: t('statusesSection'), content: <StatusManager statuses={statuses ?? []} /> },
          {
            key: 'categoriesSuppliers',
            label: t('categoriesSuppliersSection'),
            content: (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink-900">{t('categoriesSubsection')}</h3>
                  <CategoryManager
                    categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name, productCount: categoryCounts.get(c.id) ?? 0 }))}
                  />
                </div>
                <div className="border-t border-ink-100 pt-6">
                  <h3 className="mb-2 text-sm font-semibold text-ink-900">{t('suppliersSubsection')}</h3>
                  <SupplierManager
                    suppliers={(suppliers ?? []).map((s) => ({
                      id: s.id,
                      name: s.name,
                      contact_name: s.contact_name,
                      phone: s.phone,
                      email: s.email,
                      productCount: supplierCounts.get(s.id) ?? 0,
                    }))}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'users',
            label: t('usersSection'),
            content: (
              <UserInviteManager members={businessUsers ?? []} invites={invites ?? []} canInvite={user!.role === 'owner'} />
            ),
          },
          {
            key: 'templates',
            label: t('templatesSection'),
            content: (
              <div>
                <p className="mb-3 text-sm text-ink-600">{t('templatesSubtitle')}</p>
                <TemplateManager templates={templates} canEdit={user!.role === 'owner'} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
