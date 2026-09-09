import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';

export default async function StockMovementsPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('inventoryPage');

  const REASON_KEYS: Record<string, string> = {
    manual: 'reasonManual',
    pos_sale: 'reasonPosSale',
    correction: 'reasonCorrection',
  };

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('id, change, reason, created_at, product:products(name), pos_sale:pos_sales(sale_number)')
    .eq('business_id', user!.business_id)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/voorraad" className="mb-2 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft size={14} /> {t('title')}
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('movementsTitle')}</h1>
        <p className="text-sm text-ink-600">{t('movementsSubtitle')}</p>
      </div>

      {(movements ?? []).length === 0 ? (
        <Card>
          <p className="px-4 py-10 text-center text-sm text-ink-400">{t('movementsEmpty')}</p>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">{t('colProduct')}</th>
                  <th className="px-4 py-3 font-medium">{t('colMutation')}</th>
                  <th className="px-4 py-3 font-medium">{t('colReason')}</th>
                  <th className="px-4 py-3 font-medium">{t('colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {(movements ?? []).map((m) => {
                  const product = m.product as any;
                  const posSale = m.pos_sale as any;
                  return (
                    <tr key={m.id} className="border-b border-ink-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-900">{product?.name ?? '—'}</td>
                      <td className={`px-4 py-3 tabular-nums font-medium ${m.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.change > 0 ? '+' : ''}
                        {m.change}
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {REASON_KEYS[m.reason] ? t(REASON_KEYS[m.reason] as any) : m.reason}
                        {posSale?.sale_number ? ` · ${posSale.sale_number}` : ''}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{formatDateTime(m.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="space-y-2 md:hidden">
            {(movements ?? []).map((m) => {
              const product = m.product as any;
              const posSale = m.pos_sale as any;
              return (
                <div key={m.id} className="rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium text-ink-900">{product?.name ?? '—'}</span>
                    <span className={`shrink-0 tabular-nums font-medium ${m.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.change > 0 ? '+' : ''}
                      {m.change}
                    </span>
                  </div>
                  <div className="text-xs text-ink-400">
                    {REASON_KEYS[m.reason] ? t(REASON_KEYS[m.reason] as any) : m.reason}
                    {posSale?.sale_number ? ` · ${posSale.sale_number}` : ''} · {formatDateTime(m.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
