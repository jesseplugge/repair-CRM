export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { generateSignedIntakePdf } from '@/lib/pdf/generate';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const pdf = await generateSignedIntakePdf(params.id, user.business_id);
  if (!pdf) return NextResponse.json({ error: 'Nog niet ondertekend' }, { status: 404 });

  return new NextResponse(pdf.buffer, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${pdf.filename}"` },
  });
}
