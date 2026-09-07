'use client';

import type { MouseEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Tr } from '@/components/ui/table';

export function ClickableTr({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLTableRowElement>) {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) return;
    router.push(href);
  }

  return (
    <Tr onClick={handleClick} className="cursor-pointer">
      {children}
    </Tr>
  );
}
