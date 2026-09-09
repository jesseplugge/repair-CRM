import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { StockControls } from './StockControls';
import { AlertTriangle, History, Boxes } from 'lucide-react';

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

      {(products ?? []).length === 0 ? (
        <Card>
          <EmptyState icon={Boxes} title={t('empty')} />
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colProduct')}</Th>
                  <Th align="right">{t('colMinimum')}</Th>
                  <Th align="right">{t('colStock')}</Th>
                  <Th align="right">{t('colMutation')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {(products ?? []).map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-medium text-ink-900">{p.name}</Td>
                    <Td align="right" className="text-ink-500">{p.minimum_stock ?? 0}</Td>
                    <Td align="right" className={`tabular-nums ${p.stock_quantity <= (p.minimum_stock ?? 0) ? 'font-semibold text-red-600' : 'text-ink-900'}`}>
                      {p.stock_quantity}
                    </Td>
                    <Td align="right">
                      <StockControls productId={p.id} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          <div className="space-y-2 md:hidden">
            {(products ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink-900">{p.name}</div>
                  <div className="text-xs text-ink-400">
                    {t('colMinimum')}: {p.minimum_stock ?? 0} ·{' '}
                    <span className={`tabular-nums ${p.stock_quantity <= (p.minimum_stock ?? 0) ? 'font-semibold text-red-600' : ''}`}>
                      {t('colStock')}: {p.stock_quantity}
                    </span>
                  </div>
                </div>
                <StockControls productId={p.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
