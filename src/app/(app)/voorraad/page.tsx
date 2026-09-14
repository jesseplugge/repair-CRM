import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/empty-state';
import { VoorraadList } from './VoorraadList';
import { AlertTriangle, History, Boxes } from 'lucide-react';

export default async function VoorraadPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('inventoryPage');
  const { data: products } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .eq('business_id', user!.business_id)
    .eq('active', true)
    .order('name');

  const lowStock = (products ?? []).filter((p) => p.stock_quantity <= (p.minimum_stock ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('lowStockCount', { count: lowStock.length })}</p>
        </div>
        <Link href="/voorraad/bewegingen" className="flex items-center gap-1.5 self-start text-sm font-medium text-[var(--accent)] hover:underline">
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
        <VoorraadList products={products as any} />
      )}
    </div>
  );
}
