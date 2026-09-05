'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateRepairStatus } from '@/lib/actions/repairs';

type Status = { id: string; name: string; color: string | null };

export function StatusChanger({
  repairId,
  currentStatusId,
  statuses,
}: {
  repairId: string;
  currentStatusId: string;
  statuses: Status[];
}) {
  const [value, setValue] = useState(currentStatusId);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(newStatusId: string) {
    setValue(newStatusId);
    startTransition(async () => {
      await updateRepairStatus(repairId, newStatusId);
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
    >
      {statuses.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
