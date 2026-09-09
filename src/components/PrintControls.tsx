'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Printer, Download } from 'lucide-react';

export function PrintControls({
  baseUrl,
  label,
  showFormatPicker = true,
}: {
  baseUrl: string;
  label: string;
  showFormatPicker?: boolean;
}) {
  const [format, setFormat] = useState('a4');
  const [printing, setPrinting] = useState(false);
  const t = useTranslations('printControls');

  const FORMATS = [
    { value: 'a4', label: 'A4' },
    { value: 'a5', label: 'A5' },
    { value: 'thermal80', label: t('thermal80') },
    { value: 'thermal58', label: t('thermal58') },
  ];

  const url = showFormatPicker ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}format=${format}` : baseUrl;

  // The hidden/off-screen-iframe auto-print trick turned out to be
  // unreliable across browsers — the PDF itself was always fine (the
  // download link below never had a problem), so instead of fighting the
  // embedded PDF viewer inside an iframe, open it in a real tab (same as
  // the download link) and print from there, where it's confirmed to
  // actually render.
  function handlePrint() {
    setPrinting(true);
    const win = window.open(url, '_blank');
    if (!win) {
      setPrinting(false);
      return;
    }
    win.addEventListener('load', () => {
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {
          // If the browser blocks this, the tab is still open with the PDF
          // visible, so the user can print it manually from there.
        }
        setPrinting(false);
      }, 300);
    });
  }

  return (
    <div className="space-y-2">
      {showFormatPicker && (
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full rounded border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-600"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePrint}
          disabled={printing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 disabled:opacity-50"
        >
          <Printer size={15} /> {printing ? 'Bezig…' : label}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded border border-ink-200 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
          title={t('openInNewTab')}
        >
          <Download size={15} />
        </a>
      </div>
    </div>
  );
}
