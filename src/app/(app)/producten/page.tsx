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

      <Card>
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
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={Package} title={t('empty')} />
                </td>
              </tr>
            )}
          </Tbody>
        </Table>
      </Card>

      <AddProductForm categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
