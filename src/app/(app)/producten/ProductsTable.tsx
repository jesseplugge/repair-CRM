'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { formatEuro } from '@/lib/utils/currency';

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: { name: string } | null;
  purchase_price_excl_vat: number | null;
  selling_price_excl_vat: number;
  vat_rate: number;
  stock_quantity: number;
  minimum_stock: number | null;
};

function priceFor(exclVat: number | null | undefined, vatRate: number, showIncl: boolean) {
  const excl = exclVat ?? 0;
  return showIncl ? excl * (1 + vatRate / 100) : excl;
}

function VatToggle({ showIncl, onChange }: { showIncl: boolean; onChange: (showIncl: boolean) => void }) {
  const t = useTranslations('productsPage');
  return (
    <span className="ml-1.5 inline-flex overflow-hidden rounded border border-ink-200 align-middle normal-case">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-1.5 py-0.5 text-[10px] font-medium ${showIncl ? 'text-ink-400 hover:text-ink-600' : 'bg-ink-100 text-ink-900'}`}
      >
        {t('exclVatShort')}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-1.5 py-0.5 text-[10px] font-medium ${showIncl ? 'bg-ink-100 text-ink-900' : 'text-ink-400 hover:text-ink-600'}`}
      >
        {t('inclVatShort')}
      </button>
    </span>
  );
}

export function ProductsTable({ products }: { products: Product[] }) {
  const t = useTranslations('productsPage');
  const [purchaseIncl, setPurchaseIncl] = useState(false);
  const [sellIncl, setSellIncl] = useState(false);

  return (
    <>
      <Card className="hidden md:block">
        <Table>
          <Thead>
            <tr>
              <Th>{t('colName')}</Th>
              <Th>{t('colSku')}</Th>
              <Th>{t('colCategory')}</Th>
              <Th align="right">
                {t('colPurchase')}
                <VatToggle showIncl={purchaseIncl} onChange={setPurchaseIncl} />
              </Th>
              <Th align="right">
                {t('colSell')}
                <VatToggle showIncl={sellIncl} onChange={setSellIncl} />
              </Th>
              <Th align="right">{t('colVat')}</Th>
              <Th align="right">{t('colStock')}</Th>
            </tr>
          </Thead>
          <Tbody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-ink-900">{p.name}</Td>
                <Td className="text-ink-500">{p.sku ?? '—'}</Td>
                <Td className="text-ink-500">{p.category?.name ?? '—'}</Td>
                <Td align="right" className="tabular-nums text-ink-600">
                  {formatEuro(priceFor(p.purchase_price_excl_vat, p.vat_rate, purchaseIncl))}
                </Td>
                <Td align="right" className="tabular-nums text-ink-900">
                  {formatEuro(priceFor(p.selling_price_excl_vat, p.vat_rate, sellIncl))}
                </Td>
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
        <div className="flex items-center justify-end gap-4 px-1 text-xs text-ink-500">
          <span className="flex items-center">
            {t('colPurchase')}
            <VatToggle showIncl={purchaseIncl} onChange={setPurchaseIncl} />
          </span>
          <span className="flex items-center">
            {t('colSell')}
            <VatToggle showIncl={sellIncl} onChange={setSellIncl} />
          </span>
        </div>
        {products.map((p) => (
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
                {t('colPurchase')}: {formatEuro(priceFor(p.purchase_price_excl_vat, p.vat_rate, purchaseIncl))}
              </span>
              <span className="shrink-0 font-medium text-ink-900">
                {formatEuro(priceFor(p.selling_price_excl_vat, p.vat_rate, sellIncl))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
