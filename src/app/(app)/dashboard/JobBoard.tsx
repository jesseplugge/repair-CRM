'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Phone, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Drawer } from '@/components/ui/drawer';

export type JobRowData = {
  id: string;
  repairNumber: string;
  device: string;
  customer: string;
  phone: string | null;
  days: number;
  daysText: string;
  overdue: boolean;
  urgent: boolean;
  statusName: string;
  statusColor: string | null;
  amountText: string | null;
};

type TicketLabels = {
  claim: string;
  device: string;
  status: string;
  daysInShop: string;
  amount: string;
  call: string;
  open: string;
};

/**
 * The open-repairs list and its boarding-pass-style detail panel: one ranked list (not
 * status columns), the most urgent rows held in a tinted band, a row opening a ticket
 * instead of a generic modal.
 */
export function JobBoard({
  rows,
  ticketLabels,
}: {
  rows: JobRowData[];
  ticketLabels: TicketLabels;
}) {
  const [selected, setSelected] = useState<JobRowData | null>(null);

  return (
    <>
      <ul className="divide-y divide-ink-100">
        {rows.map((job) => (
          <li key={job.id}>
            <button
              type="button"
              onClick={() => setSelected(job)}
              className={clsx(
                'focus-ring group flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors',
                job.urgent ? 'bg-signal-50 hover:bg-signal-100' : 'hover:bg-ink-50'
              )}
            >
              <div
                className={clsx(
                  'w-14 shrink-0 text-right font-mono',
                  job.overdue ? 'text-danger-600' : job.urgent ? 'text-signal-600' : 'text-ink-950'
                )}
              >
                <div className="text-2xl font-bold leading-none tabular-nums">{job.days}</div>
                <div className="mt-1 text-[11px] text-ink-500">{job.daysText}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-ink-950 group-hover:underline">{job.device}</div>
                <div className="truncate text-sm text-ink-600">
                  {job.customer}
                  <span className="ml-2 font-mono text-xs text-ink-400">{job.repairNumber}</span>
                </div>
              </div>
              <div className="hidden shrink-0 sm:block">
                <StatusBadge name={job.statusName} color={job.statusColor} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `${ticketLabels.claim} ${selected.repairNumber}` : ''}>
        {selected && (
          <div className="flex flex-col">
            <div className="border-b border-dashed border-ink-300 pb-4">
              <div className="font-mono text-xs font-medium uppercase tracking-wider text-ink-500">
                {ticketLabels.claim} <span className="text-ink-950">{selected.repairNumber}</span>
              </div>
              <div className="mt-1.5 font-display text-xl font-bold text-ink-950">{selected.customer}</div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 py-5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">{ticketLabels.device}</dt>
                <dd className="mt-1 font-medium text-ink-950">{selected.device}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">{ticketLabels.status}</dt>
                <dd className="mt-1">
                  <StatusBadge name={selected.statusName} color={selected.statusColor} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">{ticketLabels.daysInShop}</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums text-ink-950">{selected.daysText}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">{ticketLabels.amount}</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums text-ink-950">{selected.amountText ?? '—'}</dd>
              </div>
            </dl>

            <div
              aria-hidden
              className="h-9 w-full rounded-sm"
              style={{ background: 'repeating-linear-gradient(90deg, #241C5B 0, #241C5B 2px, transparent 2px, transparent 5px)' }}
            />

            <div className="mt-5 flex gap-2">
              {selected.phone && (
                <a
                  href={`tel:${selected.phone.replace(/\s+/g, '')}`}
                  className="focus-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm font-medium text-ink-900 hover:border-ink-400"
                >
                  <Phone size={14} />
                  {ticketLabels.call}
                </a>
              )}
              <Link
                href={`/reparaties/${selected.id}`}
                className="focus-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded bg-mat px-3 py-2 text-sm font-medium text-white hover:bg-mat-700"
              >
                {ticketLabels.open}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
