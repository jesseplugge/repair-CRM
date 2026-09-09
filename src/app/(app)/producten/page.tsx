import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatEuro } from '@/lib/utils/currency';
import { Card } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { AddProductForm } from './AddProductForm';
import { Package } from 'lucide-react';

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

      {(products ?? []).length === 0 ? (
        <Card>
          <EmptyState icon={Package} title={t('empty')} />
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colName')}</Th>
                  <Th>{t('colSku')}</Th>
                  <Th>{t('colCategory')}</Th>
                  <Th align="right">{t('colPurchaseExcl')}</Th>
                  <Th align="right">{t('colSellExcl')}</Th>
                  <Th align="right">{t('colVat')}</Th>
                  <Th align="right">{t('colStock')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {(products ?? []).map((p: any) => (
                  <Tr key={p.id}>
                    <Td className="font-medium text-ink-900">{p.name}</Td>
                    <Td className="text-ink-500">{p.sku ?? '—'}</Td>
                    <Td className="text-ink-500">{p.category?.name ?? '—'}</Td>
                    <Td align="right" className="tabular-nums text-ink-600">{formatEuro(p.purchase_price_excl_vat)}</Td>
                    <Td align="right" className="tabular-nums text-ink-900">{formatEuro(p.selling_price_excl_vat)}</Td>
                    <Td align="right" className="text-ink-600">{p.vat_rate}%</Td>
                    <Td
                      align="right"
                      className={`tabular-nums ${p.stock_quantity <= (p.minimum_stock ?? 0) ? 'font-semibold text-red-600' : 'text-ink-900'}`}
                    >
                      {p.stock_quantity}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          <div className="space-y-2 md:hidden">
            {(products ?? []).map((p: any) => (
              <div key={p.id} className="rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-ink-900">{p.name}</span>
                  <span
                    className={`shrink-0 tabular-nums text-sm ${p.stock_quantity <= (p.minimum_stock ?? 0) ? 'font-semibold text-red-600' : 'text-ink-900'}`}
                  >
                    {t('colStock')}: {p.stock_quantity}
                  </span>
                </div>
                <div className="break-words text-xs text-ink-400">
                  {p.sku ?? '—'}
                  {p.category?.name ? ` · ${p.category.name}` : ''}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-600">
                    {t('colPurchaseExcl')}: {formatEuro(p.purchase_price_excl_vat)}
                  </span>
                  <span className="shrink-0 font-medium text-ink-900">{formatEuro(p.selling_price_excl_vat)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AddProductForm categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
