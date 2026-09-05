import { NextResponse } from 'next/server';
import { getCustomerDevices } from '@/lib/actions/devices';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const devices = await getCustomerDevices(params.id);
  return NextResponse.json(devices);
}
