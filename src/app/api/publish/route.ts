import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  try {
    const { code, sessionId } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Use existing sessionId or create new one
    const id = sessionId || crypto.randomUUID();

    // Save to KV with 30 day TTL (2592000 seconds)
    await kv.set(`artifact:${id}`, code, { ex: 2592000 });

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'young-creators-flax.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    // Create URL with session ID
    const artifactUrl = `${baseUrl}/view/${id}`;

    return NextResponse.json({
      success: true,
      url: artifactUrl,
      sessionId: id
    });

  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish artifact' },
      { status: 500 }
    );
  }
}
