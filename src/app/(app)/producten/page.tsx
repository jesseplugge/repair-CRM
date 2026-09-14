import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/empty-state';
import { AddProductForm } from './AddProductForm';
import { ProductsTable } from './ProductsTable';
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
        <ProductsTable products={products as any} />
      )}

      <AddProductForm categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
