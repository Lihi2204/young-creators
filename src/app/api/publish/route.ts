import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Directory to store published artifacts
const ARTIFACTS_DIR = path.join(process.cwd(), 'public', 'artifacts');

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Generate a unique ID for the artifact
    const id = crypto.randomBytes(6).toString('hex');

    // Ensure the artifacts directory exists
    if (!existsSync(ARTIFACTS_DIR)) {
      await mkdir(ARTIFACTS_DIR, { recursive: true });
    }

    // Save the artifact as an HTML file
    const filename = `${id}.html`;
    const filepath = path.join(ARTIFACTS_DIR, filename);

    await writeFile(filepath, code, 'utf-8');

    // Generate the URL for the artifact
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const artifactUrl = `${baseUrl}/artifacts/${id}.html`;

    return NextResponse.json({
      success: true,
      id,
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
