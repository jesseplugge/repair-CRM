import { NextRequest, NextResponse } from 'next/server';
import { searchCustomers } from '@/lib/actions/customers';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const results = await searchCustomers(q);
  return NextResponse.json(results);
}
