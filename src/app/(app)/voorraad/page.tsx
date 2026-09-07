import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StockControls } from './StockControls';
import { AlertTriangle, History } from 'lucide-react';

export default async function VoorraadPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('inventoryPage');
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', user!.business_id)
    .eq('active', true)
    .order('name');

  const lowStock = (products ?? []).filter((p) => p.stock_quantity <= (p.minimum_stock ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('lowStockCount', { count: lowStock.length })}</p>
        </div>
        <Link href="/voorraad/bewegingen" className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <History size={15} /> {t('movements')}
        </Link>
      </div>

      {lowStock.length > 0 && (
        <Card className="flex items-start gap-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
          <div className="text-sm text-amber-800">
            {t('almostOut', { names: lowStock.map((p) => p.name).join(', ') })}
          </div>
        </Card>
      )}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-2.5 font-medium">{t('colProduct')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colMinimum')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colStock')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colMutation')}</th>
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
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
