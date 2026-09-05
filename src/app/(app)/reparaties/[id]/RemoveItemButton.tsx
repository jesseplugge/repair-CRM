'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { removeRepairItem } from '@/lib/actions/repairs';

export function RemoveItemButton({ repairId, itemId }: { repairId: string; itemId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removeRepairItem(repairId, itemId);
          router.refresh();
        })
      }
      className="text-ink-300 hover:text-red-600 disabled:opacity-50"
      title="Verwijderen"
    >
      <X size={15} />
    </button>
  );
}
