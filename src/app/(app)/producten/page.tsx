import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatEuro } from '@/lib/utils/currency';
import { Card } from '@/components/ui/primitives';
import { AddProductForm } from './AddProductForm';

export default async function ProductenPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('productsPage');
  const [{ data: products }, { data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from('products').select('*, category:product_categories(name), supplier:suppliers(name)').eq('business_id', user!.business_id).order('name'),
    supabase.from('product_categories').select('*').eq('business_id', user!.business_id).order('name'),
    supabase.from('suppliers').select('*').eq('business_id', user!.business_id).order('name'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
        <p className="text-sm text-ink-600">{t('subtitle')}</p>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-2.5 font-medium">{t('colName')}</th>
              <th className="px-4 py-2.5 font-medium">{t('colSku')}</th>
              <th className="px-4 py-2.5 font-medium">{t('colCategory')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colPurchaseExcl')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colSellExcl')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colVat')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('colStock')}</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-ink-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-900">{p.name}</td>
                <td className="px-4 py-2.5 text-ink-500">{p.sku ?? '—'}</td>
                <td className="px-4 py-2.5 text-ink-500">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-600">{formatEuro(p.purchase_price_excl_vat)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{formatEuro(p.selling_price_excl_vat)}</td>
                <td className="px-4 py-2.5 text-right text-ink-600">{p.vat_rate}%</td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums ${
                    p.stock_quantity <= (p.minimum_stock ?? 0) ? 'font-semibold text-red-600' : 'text-ink-900'
                  }`}
                >
                  {p.stock_quantity}
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <AddProductForm categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
