import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { DateRangeFilter } from './DateRangeFilter';
import { Download } from 'lucide-react';

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function RapportagesPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();

  const from = searchParams.from || startOfMonth();
  const to = searchParams.to || today();
  const toExclusive = new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: repairs }, { data: posSales }, { data: allRepairsForPopular }] = await Promise.all([
    supabase
      .from('repairs')
      .select('id, final_price, parts_cost, payment_status, date_completed, repair_type_label')
      .eq('business_id', user!.business_id)
      .eq('payment_status', 'paid')
      .gte('date_completed', from)
      .lt('date_completed', toExclusive),
    supabase
      .from('pos_sales')
      .select('id, subtotal_excl_vat, total_vat, total_incl_vat, status, created_at')
      .eq('business_id', user!.business_id)
      .eq('status', 'paid')
      .gte('created_at', from)
      .lt('created_at', toExclusive),
    supabase
      .from('repairs')
      .select('repair_type_label')
      .eq('business_id', user!.business_id)
      .gte('date_received', from)
      .lt('date_received', toExclusive),
  ]);

  const { data: repairItems } = await supabase
    .from('repair_items')
    .select('repair_id, total_excl_vat, total_incl_vat, vat_rate')
    .in('repair_id', (repairs ?? []).map((r) => r.id));

  const { data: posSaleItems } = await supabase
    .from('pos_sale_items')
    .select('pos_sale_id, total_excl_vat, total_incl_vat, vat_rate')
    .in('pos_sale_id', (posSales ?? []).map((p) => p.id));

  const repairRevenueIncl = (repairs ?? []).reduce((s, r) => s + (r.final_price ?? 0), 0);
  const repairRevenueExcl = (repairItems ?? []).reduce((s, i) => s + i.total_excl_vat, 0);
  const repairVat = (repairItems ?? []).reduce((s, i) => s + (i.total_incl_vat - i.total_excl_vat), 0);
  const partsCost = (repairs ?? []).reduce((s, r) => s + (r.parts_cost ?? 0), 0);

  const productRevenueIncl = (posSales ?? []).reduce((s, p) => s + p.total_incl_vat, 0);
  const productVat = (posSales ?? []).reduce((s, p) => s + p.total_vat, 0);

  const totalOmzet = repairRevenueIncl + productRevenueIncl;
  const totalBtw = repairVat + productVat;
  const grossProfit = repairRevenueExcl - partsCost + (productRevenueIncl - productVat);

  const popularity = new Map<string, number>();
  for (const r of allRepairsForPopular ?? []) {
    const label = r.repair_type_label ?? 'Overig';
    popularity.set(label, (popularity.get(label) ?? 0) + 1);
  }
  const popular = [...popularity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const vatByRate = new Map<number, number>();
  for (const i of [...(repairItems ?? []), ...(posSaleItems ?? [])]) {
    const vat = i.total_incl_vat - i.total_excl_vat;
    vatByRate.set(i.vat_rate, (vatByRate.get(i.vat_rate) ?? 0) + vat);
  }
  const vatBreakdown = [...vatByRate.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Rapportages</h1>
          <p className="text-sm text-ink-600">Omzet, BTW en winst — berekend uit werkelijke transacties.</p>
        </div>
        <a
          href={`/api/reports/csv?from=${from}&to=${to}`}
          className="flex items-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          <Download size={15} /> CSV export
        </a>
      </div>

      <DateRangeFilter from={from} to={to} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Omzet" value={formatEuro(totalOmzet)} />
        <StatCard label="BTW" value={formatEuro(totalBtw)} />
        <StatCard label="Onderdelenkosten" value={formatEuro(partsCost)} />
        <StatCard label="Brutowinst" value={formatEuro(grossProfit)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Omzet naar bron</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">Reparaties</span>
              <span className="tabular-nums font-medium">{formatEuro(repairRevenueIncl)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">Producten (kassa)</span>
              <span className="tabular-nums font-medium">{formatEuro(productRevenueIncl)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Populaire reparaties</h3>
          <div className="space-y-2 text-sm">
            {popular.map(([label, count]) => (
              <div key={label} className="flex justify-between">
                <span className="text-ink-600">{label}</span>
                <span className="tabular-nums font-medium">{count}x</span>
              </div>
            ))}
            {popular.length === 0 && <p className="text-ink-400">Geen data in deze periode.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">BTW per tarief</h3>
          <div className="space-y-2 text-sm">
            {vatBreakdown.map(([rate, vat]) => (
              <div key={rate} className="flex justify-between">
                <span className="text-ink-600">{rate}%</span>
                <span className="tabular-nums font-medium">{formatEuro(vat)}</span>
              </div>
            ))}
            {vatBreakdown.length === 0 && <p className="text-ink-400">Geen data in deze periode.</p>}
          </div>
        </Card>
      </div>

      <p className="text-xs text-ink-400">
        Openstaande facturen en PDF-export volgen in een volgend increment.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-4">
      <div className="font-display text-2xl font-semibold tabular-nums text-ink-950">{value}</div>
      <div className="mt-1 text-sm text-ink-600">{label}</div>
    </Card>
  );
}
