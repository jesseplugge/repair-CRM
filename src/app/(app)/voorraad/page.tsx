import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StockControls } from './StockControls';
import { AlertTriangle } from 'lucide-react';

export default async function VoorraadPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', user!.business_id)
    .eq('active', true)
    .order('name');

  const lowStock = (products ?? []).filter((p) => p.stock_quantity <= (p.minimum_stock ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Voorraad</h1>
        <p className="text-sm text-ink-600">{lowStock.length} product(en) op of onder minimumvoorraad.</p>
      </div>

      {lowStock.length > 0 && (
        <Card className="flex items-start gap-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
          <div className="text-sm text-amber-800">
            Bijna op: {lowStock.map((p) => p.name).join(', ')}
          </div>
        </Card>
      )}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 text-right font-medium">Minimum</th>
              <th className="px-4 py-2.5 text-right font-medium">Voorraad</th>
              <th className="px-4 py-2.5 text-right font-medium">Mutatie</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-ink-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-900">{p.name}</td>
                <td className="px-4 py-2.5 text-right text-ink-500">{p.minimum_stock ?? 0}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${p.stock_quantity <= (p.minimum_stock ?? 0) ? 'font-semibold text-red-600' : 'text-ink-900'}`}>
                  {p.stock_quantity}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <StockControls productId={p.id} />
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-400">
                  Nog geen producten. Voeg ze toe via Producten.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
