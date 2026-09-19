import { NextResponse } from 'next/server';
import { isAdminAuthConfigured, verifyAdminPassword, setAdminCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!isAdminAuthConfigured()) {
      return NextResponse.json(
        { error: 'Admin authentication is not configured. Set a strong ADMIN_PASSWORD and AUTH_SECRET.' },
        { status: 503 }
      );
    }

    if (typeof password !== 'string' || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid admin password.' }, { status: 401 });
    }

    if (!setAdminCookie()) {
      return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin Login Error:', err);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
