import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getBusinessById, updateBusiness, deleteBusiness } from '@/lib/db';

function databaseError(error: unknown, fallback: string) {
  const notConfigured = error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED';
  return NextResponse.json(
    { error: notConfigured ? 'Database not configured. Add real Supabase environment variables.' : fallback },
    { status: notConfigured ? 503 : 500 }
  );
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const business = await getBusinessById(params.id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }
    return NextResponse.json({ business });
  } catch (err: unknown) {
    return databaseError(err, 'Failed to fetch business.');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateBusiness(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }
    return NextResponse.json({ business: updated });
  } catch (err: unknown) {
    const message = err instanceof Error && err.message === 'SLUG_ALREADY_EXISTS'
      ? 'That slug is already in use.'
      : 'Failed to update business.';
    return databaseError(err, message);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await deleteBusiness(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete business.' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return databaseError(err, 'Failed to delete business.');
  }
}
