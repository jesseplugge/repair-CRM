import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { getOpenCashSession } from '@/lib/actions/cash';
import { Card } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';
import { OpenSessionForm } from './OpenSessionForm';
import { CashSessionPanel } from './CashSessionPanel';

export default async function KassaladePage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const session = await getOpenCashSession();

  let movements: any[] = [];
  if (session) {
    const { data } = await supabase.from('cash_movements').select('*').eq('cash_session_id', session.id).order('created_at', { ascending: false });
    movements = data ?? [];
  }

  const { data: recentClosed } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('business_id', user!.business_id)
    .not('closed_at', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Kassalade</h1>
        <p className="text-sm text-ink-600">Openen, muteren en afsluiten van de contante kassa.</p>
      </div>

      {session ? (
        <CashSessionPanel session={session} movements={movements} />
      ) : (
        <OpenSessionForm />
      )}

      {recentClosed && recentClosed.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Eerdere sessies</h3>
          <div className="space-y-2 text-sm">
            {recentClosed.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0">
                <span className="text-ink-600">{formatDateTime(s.closed_at)}</span>
                <span className={`tabular-nums font-medium ${Math.abs(s.difference ?? 0) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                  {(s.difference ?? 0) > 0 ? '+' : ''}
                  {formatEuro(s.difference ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
