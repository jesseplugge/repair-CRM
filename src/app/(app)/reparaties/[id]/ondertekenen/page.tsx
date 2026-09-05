import { notFound } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getIntakeSignature } from '@/lib/actions/signatures';
import { OndertekenenClient } from './OndertekenenClient';
import { Card } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils/format';
import { CheckCircle2 } from 'lucide-react';
import { EmailButton } from '@/components/EmailButton';
import { emailSignedIntake } from '@/lib/actions/email';

export default async function OndertekenenPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();

  const { data: repair } = await supabase
    .from('repairs')
    .select('*, customer:customers(*), device:devices(*)')
    .eq('id', params.id)
    .eq('business_id', user!.business_id)
    .single();
  if (!repair) notFound();

  const existing = await getIntakeSignature(repair.id);

  const { data: terms } = await supabase
    .from('terms_versions')
    .select('*')
    .eq('business_id', user!.business_id)
    .eq('is_active', true);

  const av = (terms ?? []).find((t) => t.document_type === 'algemene_voorwaarden');

  if (existing) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 size={32} className="text-green-600" />
          <h1 className="font-display text-xl font-semibold text-ink-950">Ondertekening voltooid</h1>
          <p className="text-sm text-ink-600">Getekend op {formatDateTime(existing.signed_at)}.</p>
          <div className="flex w-full max-w-xs flex-col gap-2 pt-2">
            <a
              href={`/api/repairs/${repair.id}/signature-pdf`}
              target="_blank"
              className="rounded border border-ink-200 px-4 py-2 text-center text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              PDF openen
            </a>
            <EmailButton id={repair.id} action={emailSignedIntake} defaultEmail={(repair.customer as any)?.email} />
          </div>
        </Card>
      </div>
    );
  }

  if (!av) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-6 text-center text-sm text-ink-600">
          Geen actieve Algemene Voorwaarden ingesteld. Ga naar Instellingen → Algemene Voorwaarden om er een toe te
          voegen voordat de klant kan ondertekenen.
        </Card>
      </div>
    );
  }

  const customer = repair.customer as any;
  const device = repair.device as any;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Ondertekenen — {repair.repair_number}</h1>
        <p className="text-sm text-ink-600">
          {customer.first_name} {customer.last_name} &middot; {device.brand} {device.model}
        </p>
      </div>
      <OndertekenenClient repairId={repair.id} termsContent={av.content} termsVersionLabel={av.version_label} />
    </div>
  );
}
