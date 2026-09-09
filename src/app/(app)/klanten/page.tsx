import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { searchCustomers } from '@/lib/actions/customers';
import { Card, Button } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBox } from './SearchBox';
import { Plus, Users } from 'lucide-react';

export default async function KlantenPage({ searchParams }: { searchParams: { q?: string } }) {
  const customers = await searchCustomers(searchParams.q ?? '');
  const t = await getTranslations('customersList');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('subtitle')}</p>
        </div>
        <Link href="/klanten/nieuw" className="self-start">
          <Button variant="primary">
            <Plus size={16} /> {t('newCustomer')}
          </Button>
        </Link>
      </div>

      <SearchBox defaultValue={searchParams.q ?? ''} />

      {customers.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title={t('empty')} />
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colCustomer')}</Th>
                  <Th>{t('colNumber')}</Th>
                  <Th>{t('colPhone')}</Th>
                  <Th>{t('colEmail')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {customers.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link href={`/klanten/${c.id}`} className="font-medium text-ink-900 hover:text-[var(--accent)]">
                        {c.first_name} {c.last_name}
                      </Link>
                      {c.company_name && <div className="text-xs text-ink-400">{c.company_name}</div>}
                    </Td>
                    <Td className="tabular-nums text-ink-600">{c.customer_number}</Td>
                    <Td className="text-ink-600">{c.phone ?? '—'}</Td>
                    <Td className="text-ink-600">{c.email ?? '—'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>

          <div className="space-y-2 md:hidden">
            {customers.map((c) => (
              <Link key={c.id} href={`/klanten/${c.id}`} className="block rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-ink-900">
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-ink-400">{c.customer_number}</span>
                </div>
                {c.company_name && <div className="break-words text-xs text-ink-400">{c.company_name}</div>}
                {(c.phone || c.email) && (
                  <div className="mt-1 break-words text-xs text-ink-600">
                    {c.phone}
                    {c.phone && c.email ? ' · ' : ''}
                    {c.email}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
