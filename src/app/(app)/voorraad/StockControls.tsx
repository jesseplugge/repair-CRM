'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adjustStock } from '@/lib/actions/products';
import { Minus, Plus } from 'lucide-react';

export function StockControls({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(delta: number) {
    startTransition(async () => {
      await adjustStock(productId, delta);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        disabled={pending}
        onClick={() => change(-1)}
        className="flex h-6 w-6 items-center justify-center rounded border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-50"
      >
        <Minus size={12} />
      </button>
      <button
        disabled={pending}
        onClick={() => change(1)}
        className="flex h-6 w-6 items-center justify-center rounded border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-50"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
