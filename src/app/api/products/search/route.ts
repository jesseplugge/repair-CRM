import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/actions/products';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const results = await searchProducts(q);
  return NextResponse.json(results);
}
