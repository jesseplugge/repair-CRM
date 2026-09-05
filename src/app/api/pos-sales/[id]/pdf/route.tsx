export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { generatePosReceiptPdf } from '@/lib/pdf/generate';
import type { DocFormat } from '@/lib/pdf/format';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const format = (request.nextUrl.searchParams.get('format') as DocFormat) || 'thermal80';

  const pdf = await generatePosReceiptPdf(params.id, user.business_id, user.id, format);
  if (!pdf) return NextResponse.json({ error: 'Verkoop niet gevonden' }, { status: 404 });

  return new NextResponse(pdf.buffer, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${pdf.filename}"` },
  });
}
