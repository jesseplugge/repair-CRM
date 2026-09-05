import Link from 'next/link';
import { searchCustomers } from '@/lib/actions/customers';
import { Card, Button } from '@/components/ui/primitives';
import { SearchBox } from './SearchBox';
import { Plus } from 'lucide-react';

export default async function KlantenPage({ searchParams }: { searchParams: { q?: string } }) {
  const customers = await searchCustomers(searchParams.q ?? '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Klanten</h1>
          <p className="text-sm text-ink-600">Zoek op naam, telefoonnummer, e-mail of klantnummer.</p>
        </div>
        <Link href="/klanten/nieuw">
          <Button variant="primary">
            <Plus size={16} /> Nieuwe klant
          </Button>
        </Link>
      </div>

      <SearchBox defaultValue={searchParams.q ?? ''} />

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Klantnummer</th>
              <th className="px-4 py-3 font-medium">Telefoon</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link href={`/klanten/${c.id}`} className="font-medium text-ink-900 hover:text-[var(--accent)]">
                    {c.first_name} {c.last_name}
                  </Link>
                  {c.company_name && <div className="text-xs text-ink-400">{c.company_name}</div>}
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-600">{c.customer_number}</td>
                <td className="px-4 py-3 text-ink-600">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-ink-600">{c.email ?? '—'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-400">
                  Geen klanten gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
