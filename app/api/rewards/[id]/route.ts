import { NextResponse } from 'next/server';
import { getRewardForBusiness } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const businessId = new URL(request.url).searchParams.get('business_id');
  if (!businessId) return NextResponse.json({ error: 'Business is required.' }, { status: 400 });

  try {
    const reward = await getRewardForBusiness(params.id, businessId);
    if (!reward) return NextResponse.json({ error: 'Reward not found.' }, { status: 404 });
    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Reward lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load this reward.' }, { status: 500 });
  }
}
