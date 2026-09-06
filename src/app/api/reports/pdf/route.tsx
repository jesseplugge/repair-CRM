export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { generateReportPdf } from '@/lib/pdf/generate';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const from = request.nextUrl.searchParams.get('from') ?? new Date().toISOString().slice(0, 10);
  const to = request.nextUrl.searchParams.get('to') ?? new Date().toISOString().slice(0, 10);

  const { buffer, filename } = await generateReportPdf(user.business_id, from, to);

  return new NextResponse(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${filename}"` },
  });
}
