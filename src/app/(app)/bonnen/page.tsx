import Link from 'next/link';
import { searchReceipts } from '@/lib/actions/receipts';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import { SearchBox } from './SearchBox';
import { Download } from 'lucide-react';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  intake: { label: 'Intakebon', color: '#0C7C82' },
  repair_completion: { label: 'Afhaalbon', color: '#2F8F5B' },
  pos_sale: { label: 'Kassabon', color: '#495164' },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Bonnen</h1>
        <p className="text-sm text-ink-600">
          Alle uitgegeven intakebonnen, afhaalbonnen en kassabonnen op één plek — handig als een klant terugkomt
          met een vraag over een eerdere bon.
        </p>
      </div>

      <SearchBox defaultValue={searchParams.q ?? ''} />

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Bonnummer</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Referentie</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 text-right font-medium">Actie</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => {
              const type = TYPE_LABELS[r.type] ?? { label: r.type, color: '#495164' };
              const url = pdfUrl(r);
              const reference = r.repairNumber ?? r.saleNumber;
              const referenceHref = r.repairId ? `/reparaties/${r.repairId}` : null;
              return (
                <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{r.receiptNumber}</td>
                  <td className="px-4 py-3">
                    <StatusBadge name={type.label} color={type.color} />
                  </td>
                  <td className="px-4 py-3 text-ink-700">{r.customerName ?? 'Contant'}</td>
                  <td className="px-4 py-3 text-ink-600">
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
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                      >
                        <Download size={13} /> Bekijken
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                  {searchParams.q ? 'Geen bonnen gevonden.' : 'Nog geen bonnen uitgegeven.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
