import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { markRewardUsedByAdmin } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (status !== 'USED') {
      return NextResponse.json({ error: 'A used reward cannot be reactivated.' }, { status: 400 });
    }

    const reward = await markRewardUsedByAdmin(params.id);
    if (!reward) {
      return NextResponse.json({ error: 'Reward is already used or does not exist.' }, { status: 409 });
    }

    return NextResponse.json({ reward });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update reward status.' }, { status: 500 });
  }
}
