import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { searchCatalog } from '@/lib/actions/repairs';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const results = await searchCatalog(q, user.business_id);
  return NextResponse.json(results);
}
