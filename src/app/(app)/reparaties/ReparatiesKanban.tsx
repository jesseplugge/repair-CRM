'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateRepairStatus } from '@/lib/actions/repairs';
import { formatEuro } from '@/lib/utils/currency';

type Status = { id: string; name: string; color: string | null };
type Repair = {
  id: string;
  repair_number: string;
  repair_type_label: string | null;
  estimated_price: number | null;
  final_price: number | null;
  status: { id: string; name: string; color: string | null } | null;
  customer: { first_name: string; last_name: string } | null;
  device: { brand: string; model: string } | null;
};

export function ReparatiesKanban({ statuses, repairs }: { statuses: Status[]; repairs: Repair[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  function drop(statusId: string) {
    setOverColumn(null);
    if (!dragging) return;
    const repairId = dragging;
    setDragging(null);
    startTransition(async () => {
      await updateRepairStatus(repairId, statusId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const columnRepairs = repairs.filter((r) => r.status?.id === status.id);
        return (
          <div
            key={status.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(status.id);
            }}
            onDragLeave={() => setOverColumn((c) => (c === status.id ? null : c))}
            onDrop={() => drop(status.id)}
            className={`w-72 shrink-0 rounded-lg border p-2 transition-colors ${
              overColumn === status.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-ink-100 bg-ink-50'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 px-2 py-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color ?? '#495164' }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{status.name}</span>
              <span className="text-xs text-ink-400">{columnRepairs.length}</span>
            </div>
            <div className="space-y-2">
              {columnRepairs.map((r) => (
                <Link key={r.id} href={`/reparaties/${r.id}`}>
                  <div
                    draggable
                    onDragStart={() => setDragging(r.id)}
                    onDragEnd={() => setDragging(null)}
                    className={`cursor-grab rounded-lg border border-ink-100 bg-white p-3 shadow-card active:cursor-grabbing ${pending && dragging === r.id ? 'opacity-50' : ''}`}
                  >
                    <div className="text-sm font-medium text-ink-900">{r.repair_number}</div>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {r.customer?.first_name} {r.customer?.last_name}
                    </div>
                    <div className="text-xs text-ink-400">
                      {r.device?.brand} {r.device?.model}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-ink-500">{r.repair_type_label ?? ''}</span>
                      <span className="tabular-nums text-xs font-medium text-ink-900">
                        {formatEuro(r.final_price ?? r.estimated_price)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {columnRepairs.length === 0 && <p className="px-2 py-4 text-center text-xs text-ink-300">Leeg</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
