import { PosTerminal } from './PosTerminal';
import Link from 'next/link';

export default function KassaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Kassa</h1>
          <p className="text-sm text-ink-600">Losse verkoop van producten, zonder reparatie.</p>
        </div>
        <Link href="/kassa/kassalade" className="rounded border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
          Kassalade
        </Link>
      </div>
      <PosTerminal />
    </div>
  );
}
