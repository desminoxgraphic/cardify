import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const BUSINESS_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Database storage is not configured.' }, { status: 503 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const kind = form.get('kind') === 'cover' ? 'cover' : 'logo';
    const businessId = form.get('business_id');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
    if (typeof businessId !== 'string' || !BUSINESS_ID_PATTERN.test(businessId)) {
      return NextResponse.json({ error: 'A valid business upload ID is required.' }, { status: 400 });
    }

    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) return NextResponse.json({ error: 'Use a PNG, JPG, or WEBP image.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image must be 5 MB or smaller.' }, { status: 400 });

    const bucket = 'business-assets';
    const path = `businesses/${businessId}/${kind}-${Date.now()}.${extension}`;
    const { data: uploadData, error } = await supabaseServer.storage.from(bucket).upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });
    if (error) throw error;

    const { data } = supabaseServer.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path: uploadData.path });
  } catch (error) {
    console.error('Business asset upload failed:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      statusCode: typeof error === 'object' && error !== null && 'statusCode' in error ? error.statusCode : undefined,
    });
    return NextResponse.json({ error: 'Upload failed. Check the server log for the Supabase Storage error.' }, { status: 500 });
  }
}
