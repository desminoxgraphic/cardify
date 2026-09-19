import { NextResponse } from 'next/server';
import { createReward } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, customer_name, customer_phone } = body;

    if (!business_id || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'Please provide your name and phone number.' },
        { status: 400 }
      );
    }

    const reward = await createReward({
      business_id,
      customer_name,
      customer_phone,
    });

    return NextResponse.json({ reward });
  } catch (err: unknown) {
    console.error('API Error in POST /api/rewards/create:', err);
    const notConfigured = err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED';
    return NextResponse.json(
      { error: notConfigured ? 'Card service is not configured yet.' : "We couldn't create your card. Please try again." },
      { status: notConfigured ? 503 : 500 }
    );
  }
}
