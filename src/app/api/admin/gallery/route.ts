import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface ArtifactData {
  code: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
  id: string;
}

// GET - Fetch all gallery items for admin
export async function GET() {
  try {
    // Get all artifact IDs from gallery list
    const ids = await kv.lrange('gallery:items', 0, -1);

    const items: ArtifactData[] = [];
    for (const id of ids) {
      const artifact = await kv.get<ArtifactData | string>(`artifact:${id}`);
      if (artifact) {
        if (typeof artifact === 'string') {
          items.push({
            code: artifact,
            title: 'יצירה ללא שם',
            description: '',
            tags: ['יצירה'],
            createdAt: Date.now(),
            id: id as string
          });
        } else {
          items.push({ ...artifact, id: id as string });
        }
      }
    }

    return NextResponse.json({ items });

  } catch (error: any) {
    console.error('Admin gallery error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

// PATCH - Update artifact title
export async function PATCH(request: NextRequest) {
  try {
    const { id, title } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing id or title' }, { status: 400 });
    }

    // Get existing artifact
    const artifact = await kv.get<ArtifactData>(`artifact:${id}`);
    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    // Update with new title
    const updatedArtifact = {
      ...artifact,
      title
    };

    await kv.set(`artifact:${id}`, updatedArtifact, { ex: 2592000 });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update' },
      { status: 500 }
    );
  }
}

// DELETE - Remove artifact
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Remove from gallery list
    await kv.lrem('gallery:items', 0, id);

    // Delete the artifact data
    await kv.del(`artifact:${id}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}
