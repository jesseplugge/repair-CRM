import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { searchReceipts } from '@/lib/actions/receipts';
import { Card } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import { SearchBox } from './SearchBox';
import { Download, Receipt } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  intake: '#0C7C82',
  repair_completion: '#2F8F5B',
  pos_sale: '#495164',
};
const TYPE_KEYS: Record<string, string> = {
  intake: 'typeIntake',
  repair_completion: 'typeCompletion',
  pos_sale: 'typePos',
};

function pdfUrl(receipt: Awaited<ReturnType<typeof searchReceipts>>[number]) {
  if (receipt.type === 'intake' && receipt.repairId) {
    return `/api/repairs/${receipt.repairId}/intake-pdf?format=${receipt.format}`;
  }
  if (receipt.type === 'repair_completion' && receipt.repairId) {
    return `/api/repairs/${receipt.repairId}/receipt-pdf?format=${receipt.format}`;
  }
  if (receipt.type === 'pos_sale' && receipt.posSaleId) {
    return `/api/pos-sales/${receipt.posSaleId}/pdf?format=${receipt.format}`;
  }
  return null;
}

export default async function BonnenPage({ searchParams }: { searchParams: { q?: string } }) {
  const receipts = await searchReceipts(searchParams.q ?? '');
  const t = await getTranslations('receiptsPage');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
        <p className="text-sm text-ink-600">{t('subtitle')}</p>
      </div>

      <SearchBox defaultValue={searchParams.q ?? ''} />

      {receipts.length === 0 ? (
        <Card>
          <EmptyState icon={Receipt} title={searchParams.q ? t('emptySearch') : t('emptyNone')} />
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colNumber')}</Th>
                  <Th>{t('colType')}</Th>
                  <Th>{t('colCustomer')}</Th>
                  <Th>{t('colReference')}</Th>
                  <Th>{t('colDate')}</Th>
                  <Th align="right">{t('colAction')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {receipts.map((r) => {
                  const typeLabel = TYPE_KEYS[r.type] ? t(TYPE_KEYS[r.type] as any) : r.type;
                  const typeColor = TYPE_COLORS[r.type] ?? '#495164';
                  const url = pdfUrl(r);
                  const reference = r.repairNumber ?? r.saleNumber;
                  const referenceHref = r.repairId ? `/reparaties/${r.repairId}` : null;
                  return (
                    <Tr key={r.id}>
                      <Td className="font-medium text-ink-900">{r.receiptNumber}</Td>
                      <Td>
                        <StatusBadge name={typeLabel} color={typeColor} />
                      </Td>
                      <Td className="text-ink-700">{r.customerName ?? t('cash')}</Td>
                      <Td className="text-ink-600">
                        {reference ? (
                          referenceHref ? (
                            <Link href={referenceHref} className="text-[var(--accent)] hover:underline">
                              {reference}
                            </Link>
                          ) : (
                            reference
                          )
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td className="text-ink-600">{formatDateTime(r.createdAt)}</Td>
                      <Td align="right">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="focus-ring inline-flex items-center gap-1.5 rounded border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                          >
                            <Download size={13} /> {t('view')}
                          </a>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Card>

          <div className="space-y-2 md:hidden">
            {receipts.map((r) => {
              const typeLabel = TYPE_KEYS[r.type] ? t(TYPE_KEYS[r.type] as any) : r.type;
              const typeColor = TYPE_COLORS[r.type] ?? '#495164';
              const url = pdfUrl(r);
              const reference = r.repairNumber ?? r.saleNumber;
              const referenceHref = r.repairId ? `/reparaties/${r.repairId}` : null;
              return (
                <div key={r.id} className="rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink-900">{r.receiptNumber}</span>
                    <StatusBadge name={typeLabel} color={typeColor} />
                  </div>
                  <div className="mt-0.5 text-sm text-ink-700">{r.customerName ?? t('cash')}</div>
                  <div className="text-xs text-ink-400">
                    {reference ? (
                      referenceHref ? (
                        <Link href={referenceHref} className="text-[var(--accent)] hover:underline">
                          {reference}
                        </Link>
                      ) : (
                        reference
                      )
                    ) : (
                      '—'
                    )}
                    {' · '}
                    {formatDateTime(r.createdAt)}
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                    >
                      <Download size={13} /> {t('view')}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
