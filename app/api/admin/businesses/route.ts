import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getAllBusinesses, createBusiness, getBusinessStats } from '@/lib/db';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const businesses = await getAllBusinesses();
    const result = await Promise.all(
      businesses.map(async (b) => {
        const stats = await getBusinessStats(b.id);
        return {
          ...b,
          stats,
        };
      })
    );

    return NextResponse.json({ businesses: result });
  } catch (err: any) {
    console.error('API Error GET /api/admin/businesses:', err);
    const message = err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED'
      ? 'Database not configured. Add the required Supabase environment variables.'
      : 'Failed to fetch businesses.';
    return NextResponse.json({ error: message }, { status: err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, slug, logo_url, cover_image_url, primary_color, google_review_url, share_url, share_message, discount_percentage, phone, is_active } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Business name and slug are required.' }, { status: 400 });
    }

    const business = await createBusiness({
      id,
      name,
      slug,
      logo_url,
      cover_image_url,
      primary_color,
      google_review_url,
      share_url,
      share_message,
      discount_percentage: Number(discount_percentage) || 10,
      phone,
      is_active,
    });

    return NextResponse.json({ business });
  } catch (err: any) {
    console.error('API Error POST /api/admin/businesses:', err);
    const message = err instanceof Error && err.message === 'SLUG_ALREADY_EXISTS'
      ? 'That slug is already in use.'
      : err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED'
        ? 'Database not configured. Add the required Supabase environment variables.'
        : 'Failed to create business.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
