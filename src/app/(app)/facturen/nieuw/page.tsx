import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { createInvoiceFromRepair } from '@/lib/actions/invoices';
import { Button, Card } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { ManualInvoiceForm } from './ManualInvoiceForm';

export default async function NieuweFactuurPage({ searchParams }: { searchParams: { repair_id?: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();

  if (searchParams.repair_id) {
    const { data: repair } = await supabase
      .from('repairs')
      .select('*, customer:customers(first_name, last_name)')
      .eq('id', searchParams.repair_id)
      .eq('business_id', user!.business_id)
      .single();

    async function submitInvoiceFromRepair(formData: FormData) {
      'use server';
      await createInvoiceFromRepair({ error: '' }, formData);
    }

    if (repair) {
      const { data: items } = await supabase.from('repair_items').select('*').eq('repair_id', repair.id);
      const totalInclVat = (items ?? []).reduce((s, i) => s + i.total_incl_vat, 0);
      const customer = repair.customer as any;

      return (
        <div className="mx-auto max-w-xl space-y-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-950">Factuur maken</h1>
            <p className="text-sm text-ink-600">Vanuit reparatie {repair.repair_number}</p>
          </div>
          <Card className="p-5">
            <p className="text-sm text-ink-700">
              <span className="font-medium">
                {customer.first_name} {customer.last_name}
              </span>{' '}
              &middot; {repair.repair_type_label}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              {(items ?? []).map((i) => (
                <div key={i.id} className="flex justify-between text-ink-600">
                  <span>{i.description}</span>
                  <span className="tabular-nums">{formatEuro(i.total_incl_vat)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 font-display text-lg font-semibold text-ink-950">
              <span>Totaal</span>
              <span className="tabular-nums">{formatEuro(totalInclVat)}</span>
            </div>
            <form action={submitInvoiceFromRepair} className="mt-4">
              <input type="hidden" name="repair_id" value={repair.id} />
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Factuur aanmaken
              </Button>
            </form>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Nieuwe factuur</h1>
        <p className="text-sm text-ink-600">Handmatige factuur, niet gekoppeld aan een reparatie.</p>
      </div>
      <ManualInvoiceForm />
    </div>
  );
}
