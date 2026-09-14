'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Card, Input } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { StockControls } from './StockControls';

type Product = {
  id: string;
  name: string;
  category: { name: string } | null;
  stock_quantity: number;
  minimum_stock: number | null;
};

export function VoorraadList({ products }: { products: Product[] }) {
  const t = useTranslations('inventoryPage');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => {
    const names = new Set(products.map((p) => p.category?.name).filter((n): n is string => !!n));
    return Array.from(names).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      const matchesCategory = !category || p.category?.name === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] sm:w-56"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="px-4 py-8 text-center text-sm text-ink-400">{t('noResults')}</p>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colProduct')}</Th>
                  <Th>{t('colCategory')}</Th>
                  <Th align="right">{t('colMinimum')}</Th>
                  <Th align="right">{t('colStock')}</Th>
                  <Th align="right">{t('colMutation')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {filtered.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-medium text-ink-900">{p.name}</Td>
                    <Td className="text-ink-500">{p.category?.name ?? '—'}</Td>
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
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink-900">{p.name}</div>
                  <div className="text-xs text-ink-400">
                    {p.category?.name ? `${p.category.name} · ` : ''}
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
