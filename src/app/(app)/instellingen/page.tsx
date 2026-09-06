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
        <h1 className="font-display text-2xl font-semibold text-ink-950">Instellingen</h1>
        <p className="text-sm text-ink-600">Bedrijfsgegevens, reparatiecatalogus en statussen.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Merk &amp; huisstijl</h2>
        <div className="space-y-4 rounded-lg border border-ink-100 bg-white p-5 shadow-card">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-900">Logo</p>
            <LogoUploader currentLogoUrl={business!.logo_url} />
          </div>
          <div className="border-t border-ink-100 pt-4">
            <p className="mb-2 text-sm font-medium text-ink-900">Accentkleur</p>
            <AccentColorPicker businessId={business!.id} currentColor={business!.accent_color} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Bedrijf</h2>
        <BusinessForm business={business!} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Reparatiecatalogus</h2>
        <p className="mb-3 text-sm text-ink-600">
          Voorgedefinieerde reparaties met vaste prijs, zodat je bij intake alleen hoeft te selecteren (§8).
        </p>
        <CatalogManager items={catalog ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Algemene Voorwaarden</h2>
        <p className="mb-3 text-sm text-ink-600">
          Gekoppeld aan elke ondertekende intake (§15A). Een nieuwe versie deactiveert de vorige — al ondertekende
          reparaties blijven naar hun eigen versie verwijzen.
        </p>
        <TermsManager versions={terms ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Reparatiestatussen</h2>
        <StatusManager statuses={statuses ?? []} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Gebruikers</h2>
        <UserInviteManager
          members={businessUsers ?? []}
          invites={invites ?? []}
          canInvite={user!.role === 'owner'}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Documentsjablonen</h2>
        <p className="mb-3 text-sm text-ink-600">
          Pas de opmerkingen en voetteksten aan die op je PDF-documenten verschijnen. Lay-out en berekende bedragen
          blijven vast — alleen deze teksten zijn aanpasbaar.
        </p>
        <TemplateManager templates={templates} canEdit={user!.role === 'owner'} />
      </section>
    </div>
  );
}
