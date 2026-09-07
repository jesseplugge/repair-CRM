'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { globalSearch, type SearchResult } from '@/lib/actions/search';
import { Search, PlusCircle, UserPlus, ShoppingCart, FileText, Wrench } from 'lucide-react';

export function CommandPalette() {
  const t = useTranslations('commandPalette');
  const TYPE_LABELS: Record<SearchResult['type'], string> = {
    customer: t('typeCustomer'),
    device: t('typeDevice'),
    repair: t('typeRepair'),
    invoice: t('typeInvoice'),
    product: t('typeProduct'),
  };

  const QUICK_ACTIONS = [
    { href: '/reparaties/nieuw', label: t('actionNewRepair'), icon: PlusCircle },
    { href: '/klanten/nieuw', label: t('actionNewCustomer'), icon: UserPlus },
    { href: '/kassa', label: t('actionStartSale'), icon: ShoppingCart },
    { href: '/facturen/nieuw', label: t('actionCreateInvoice'), icon: FileText },
    { href: '/reparaties?view=kanban', label: t('actionRepairsKanban'), icon: Wrench },
  ];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const r = await globalSearch(query);
      setResults(r);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer.current);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-lg border border-ink-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
          <Search size={16} className="text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 text-sm outline-none placeholder:text-ink-400"
          />
          <kbd className="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-400">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <>
              <div className="px-2 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-ink-400">{t('quickStart')}</div>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.href}
                  onClick={() => go(a.href)}
                  className="flex w-full items-center gap-3 rounded px-2 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                >
                  <a.icon size={15} className="text-[var(--accent)]" />
                  {a.label}
                </button>
              ))}
            </>
          ) : loading ? (
            <div className="px-2 py-4 text-sm text-ink-400">{t('searching')}</div>
          ) : results.length === 0 ? (
            <div className="px-2 py-4 text-sm text-ink-400">{t('noResults')}</div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r.href)}
                className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-ink-50"
              >
                <div>
                  <div className="font-medium text-ink-900">{r.title}</div>
                  {r.subtitle && <div className="text-xs text-ink-400">{r.subtitle}</div>}
                </div>
                <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-ink-500">
                  {TYPE_LABELS[r.type]}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
