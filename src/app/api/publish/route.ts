import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Encode the code as base64 and make it URL-safe
    const base64Code = Buffer.from(code).toString('base64');
    const encodedCode = encodeURIComponent(base64Code);

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'young-creators-flax.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    // Create URL with encoded code
    const artifactUrl = `${baseUrl}/view?code=${encodedCode}`;

    return NextResponse.json({
      success: true,
      url: artifactUrl
    });

  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish artifact' },
      { status: 500 }
    );
  }
}
