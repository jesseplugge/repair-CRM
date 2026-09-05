'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAccentColor } from '@/lib/actions/settings';

const PRESETS = ['#0C7C82', '#2D5DF0', '#C97A22', '#2F8F5B', '#C4453A', '#6B4EE6'];

export function AccentColorPicker({ businessId, currentColor }: { businessId: string; currentColor: string }) {
  const [color, setColor] = useState(currentColor);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply(hex: string) {
    setColor(hex);
    startTransition(async () => {
      await updateAccentColor(businessId, hex);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={color}
        onChange={(e) => apply(e.target.value)}
        disabled={pending}
        className="h-9 w-9 cursor-pointer rounded border border-ink-200"
      />
      <div className="flex gap-1.5">
        {PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => apply(hex)}
            disabled={pending}
            className="h-7 w-7 rounded-full border border-ink-200"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
      <span className="text-xs text-ink-400">Kleurt knoppen, actieve menu-items en documenten.</span>
    </div>
  );
}
