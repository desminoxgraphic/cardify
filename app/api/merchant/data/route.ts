import { NextResponse } from 'next/server';
import { getBusinessByMerchantToken, getRewardsByBusinessId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
    }

    const business = await getBusinessByMerchantToken(token);
    if (!business || !business.is_active) {
      return NextResponse.json({ error: 'Invalid merchant token.' }, { status: 404 });
    }

    const rewards = await getRewardsByBusinessId(business.id);

    return NextResponse.json({
      business,
      rewards,
    });
  } catch (err: unknown) {
    console.error('API Error in GET /api/merchant/data:', err);
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch merchant data.' }, { status: 500 });
  }
}
