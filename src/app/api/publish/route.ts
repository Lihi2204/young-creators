import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Generate a short description of the artifact using Claude
async function generateDescription(code: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `תסתכל על הקוד הזה ותכתוב תיאור קצר בעברית (עד 2 משפטים קצרים) שמסביר מה היצירה הזו עושה. התיאור צריך להיות ברור לילדים.

קוד:
${code.substring(0, 3000)}

תיאור קצר:`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    // Limit to ~120 chars
    return text.trim().substring(0, 150);
  } catch (error) {
    console.error('Failed to generate description:', error);
    return '';
  }
}

// Generate a short title from user request
function generateTitle(userRequest: string): string {
  // Take first 4-5 words
  const words = userRequest.split(' ').slice(0, 5);
  let title = words.join(' ');
  if (title.length > 30) {
    title = title.substring(0, 27) + '...';
  }
  return title || 'יצירה חדשה';
}

// Auto-detect tags based on code content
function detectTags(code: string): string[] {
  const tags: string[] = [];
  const lowerCode = code.toLowerCase();

  // Game detection
  if (lowerCode.includes('canvas') &&
      (lowerCode.includes('gameloop') || lowerCode.includes('game') ||
       lowerCode.includes('score') || lowerCode.includes('animationframe'))) {
    tags.push('משחק');
  }

  // Drawing detection
  if ((lowerCode.includes('draw') || lowerCode.includes('paint') || lowerCode.includes('canvas')) &&
      (lowerCode.includes('color') || lowerCode.includes('brush') || lowerCode.includes('stroke'))) {
    if (!tags.includes('משחק')) {
      tags.push('ציור');
    }
  }

  // Story detection
  if (lowerCode.includes('סיפור') || lowerCode.includes('story') ||
      lowerCode.includes('פעם') || lowerCode.includes('הסוף')) {
    tags.push('סיפור');
  }

  // Tool detection
  if (lowerCode.includes('calculator') || lowerCode.includes('מחשבון') ||
      lowerCode.includes('converter') || lowerCode.includes('המרה')) {
    tags.push('כלי');
  }

  // Default tag if none detected
  if (tags.length === 0) {
    tags.push('יצירה');
  }

  return tags;
}

export async function POST(request: NextRequest) {
  try {
    const { code, sessionId, title, userRequest } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Use existing sessionId or create new one
    const id = sessionId || crypto.randomUUID();
    const isNewArtifact = !sessionId;

    // Auto-detect tags
    const tags = detectTags(code);

    // For updates, get existing artifact to preserve title and description
    let existingArtifact: { title?: string; description?: string } | null = null;
    if (!isNewArtifact) {
      existingArtifact = await kv.get<{ title?: string; description?: string }>(`artifact:${id}`);
    }

    // Handle title:
    // - If user provided title, use it
    // - For new artifacts without title: generate from userRequest
    // - For updates without title: keep existing title
    let finalTitle = title;
    if (!finalTitle) {
      if (isNewArtifact && userRequest) {
        finalTitle = generateTitle(userRequest);
      } else if (!isNewArtifact && existingArtifact?.title) {
        finalTitle = existingArtifact.title;
      } else {
        finalTitle = 'יצירה ללא שם';
      }
    }

    // Handle description:
    // - For new artifacts: generate description using AI
    // - For updates: keep existing description from KV
    let finalDescription = '';
    if (isNewArtifact) {
      finalDescription = await generateDescription(code);
    } else {
      finalDescription = existingArtifact?.description || '';
    }

    // Save artifact with metadata
    const artifactData = {
      code,
      title: finalTitle,
      description: finalDescription,
      tags,
      createdAt: Date.now(),
      id
    };

    await kv.set(`artifact:${id}`, artifactData, { ex: 2592000 });

    // Add to gallery list only for new artifacts
    if (isNewArtifact) {
      await kv.lpush('gallery:items', id);
    }

    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'young-creators-flax.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    // Create URL with session ID
    const artifactUrl = `${baseUrl}/view/${id}`;

    return NextResponse.json({
      success: true,
      url: artifactUrl,
      sessionId: id,
      tags
    });

  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish artifact' },
      { status: 500 }
    );
  }
}
