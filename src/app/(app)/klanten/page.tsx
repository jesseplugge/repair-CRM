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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('subtitle')}</p>
        </div>
        <Link href="/klanten/nieuw">
          <Button variant="primary">
            <Plus size={16} /> {t('newCustomer')}
          </Button>
        </Link>
      </div>

      <SearchBox defaultValue={searchParams.q ?? ''} />

      <Card>
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
            {customers.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon={Users} title={t('empty')} />
                </td>
              </tr>
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
