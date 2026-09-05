import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

function csvEscape(value: unknown) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const supabase = createClient();

  const from = request.nextUrl.searchParams.get('from') ?? new Date().toISOString().slice(0, 10);
  const to = request.nextUrl.searchParams.get('to') ?? new Date().toISOString().slice(0, 10);
  const toExclusive = new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: repairs }, { data: posSales }] = await Promise.all([
    supabase
      .from('repairs')
      .select('repair_number, repair_type_label, final_price, payment_status, payment_method, date_completed')
      .eq('business_id', user.business_id)
      .eq('payment_status', 'paid')
      .gte('date_completed', from)
      .lt('date_completed', toExclusive),
    supabase
      .from('pos_sales')
      .select('sale_number, total_incl_vat, status, created_at')
      .eq('business_id', user.business_id)
      .eq('status', 'paid')
      .gte('created_at', from)
      .lt('created_at', toExclusive),
  ]);

  const rows = [['type', 'nummer', 'omschrijving', 'datum', 'bedrag_incl_btw', 'betaalmethode']];
  for (const r of repairs ?? []) {
    rows.push(['reparatie', r.repair_number, r.repair_type_label ?? '', r.date_completed ?? '', String(r.final_price ?? 0), r.payment_method ?? '']);
  }
  for (const p of posSales ?? []) {
    rows.push(['kassaverkoop', p.sale_number, '', p.created_at, String(p.total_incl_vat), '']);
  }

  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rapportage-${from}-tot-${to}.csv"`,
    },
  });
}
