import { NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
    }

    const business = await getBusinessBySlug(slug);
    if (!business || !business.is_active) {
      return NextResponse.json({ error: 'Business not found or disabled.' }, { status: 404 });
    }

    // Do not leak merchant token in public endpoint
    const { merchant_token, next_serial, ...publicBusiness } = business;
    void merchant_token;
    void next_serial;

    return NextResponse.json({ business: publicBusiness });
  } catch (err) {
    console.error('API Error in GET /api/business/[slug]:', err);
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch business details.' }, { status: 500 });
  }
}
