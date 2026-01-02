import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface ArtifactData {
  code: string;
  title: string;
  tags: string[];
  createdAt: number;
  id: string;
}

export async function GET(request: NextRequest) {
  try {
    const tag = request.nextUrl.searchParams.get('tag');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    // Get list of artifact IDs from gallery
    const ids = await kv.lrange('gallery:items', 0, limit - 1);

    if (!ids || ids.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Fetch all artifacts
    const items: ArtifactData[] = [];
    for (const id of ids) {
      const artifact = await kv.get<ArtifactData | string>(`artifact:${id}`);
      if (artifact) {
        // Handle both old format (string) and new format (object)
        if (typeof artifact === 'string') {
          items.push({
            code: artifact,
            title: 'יצירה ללא שם',
            tags: ['יצירה'],
            createdAt: Date.now(),
            id: id as string
          });
        } else {
          items.push({ ...artifact, id: id as string });
        }
      }
    }

    // Filter by tag if specified
    const filtered = tag
      ? items.filter(item => item.tags?.includes(tag))
      : items;

    // Don't send the full code to the gallery list (too heavy)
    const lightItems = filtered.map(({ code, ...rest }) => ({
      ...rest,
      hasCode: !!code
    }));

    return NextResponse.json({ items: lightItems });

  } catch (error: any) {
    console.error('Gallery error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}
