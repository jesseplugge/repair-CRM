'use client';

import { useRef, useState } from 'react';
import { Printer, Download } from 'lucide-react';

const FORMATS = [
  { value: 'a4', label: 'A4' },
  { value: 'a5', label: 'A5' },
  { value: 'thermal80', label: '80mm thermisch' },
  { value: 'thermal58', label: '58mm thermisch' },
];

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [printing, setPrinting] = useState(false);

  const url = showFormatPicker ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}format=${format}` : baseUrl;

  function handlePrint() {
    setPrinting(true);
    if (iframeRef.current) {
      // Re-assigning the same src won't re-fire onLoad in some browsers, so clear first.
      iframeRef.current.src = 'about:blank';
      requestAnimationFrame(() => {
        if (iframeRef.current) iframeRef.current.src = url;
      });
    }
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
          title="PDF openen in nieuw tabblad"
        >
          <Download size={15} />
        </a>
      </div>
      <iframe
        ref={iframeRef}
        title="print-frame"
        style={{ display: 'none' }}
        onLoad={() => {
          const src = iframeRef.current?.getAttribute('src');
          if (!src || src === 'about:blank') return;
          try {
            iframeRef.current?.contentWindow?.focus();
            iframeRef.current?.contentWindow?.print();
          } catch {
            // Some browsers block cross-origin frame printing — the download
            // link above is the fallback in that case.
          }
          setPrinting(false);
        }}
      />
    </div>
  );
}
