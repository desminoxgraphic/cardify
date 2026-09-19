import { NextResponse } from 'next/server';
import { redeemReward } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, reward_id } = body;

    if (!token || !reward_id) {
      return NextResponse.json(
        { error: 'Invalid merchant token or reward ID.' },
        { status: 400 }
      );
    }

    const result = await redeemReward(token, reward_id);
    if (!result.success) {
      const alreadyUsed = result.error === 'This card has already been used or does not exist.';
      return NextResponse.json(
        { success: false, error: alreadyUsed ? 'This card has already been used.' : result.error },
        { status: alreadyUsed ? 409 : 400 }
      );
    }

    return NextResponse.json({ success: true, reward: result.reward });
  } catch (err: any) {
    console.error('API Error in POST /api/merchant/redeem:', err);
    return NextResponse.json(
      { error: 'Failed to redeem card.' },
      { status: 500 }
    );
  }
}
