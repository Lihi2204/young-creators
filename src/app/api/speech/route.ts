import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `אתה "יוצר", עוזר ידידותי וחכם לילדים שעוזר להם ליצור משחקים, ציורים וסיפורים.
אתה מדבר בעברית בצורה פשוטה, חמה ומתאימה לילדים.

## התהליך שלך:
כשילד מבקש ליצור משהו (משחק, ציור, סיפור), אתה לא בונה מיד!
במקום זאת, אתה שואל 2-3 שאלות קצרות כדי להבין מה בדיוק הילד רוצה.

## דוגמה לשיחה:
ילד: "אני רוצה משחק"
אתה: "וואו, איזה כיף! אני אוהב לבנות משחקים! ספר לי, איזה סוג משחק אתה אוהב? משחק עם כדורים? בלונים? חיות?"

ילד: "בלונים"
אתה: "בלונים זה מעולה! ומה קורה במשחק - צריך לתפוס אותם? לפוצץ אותם? או אולי לצייר עליהם?"

ילד: "לפוצץ"
אתה: "סבבה! ואיזה צבע בלונים אתה הכי אוהב?"

ילד: "אדום"
אתה: "מושלם! עכשיו אני בונה לך משחק פיצוץ בלונים אדומים! זה יהיה מדהים!"

## כללים חשובים:
- דבר בצורה עליזה ומעודדת
- שאל שאלה אחת בכל פעם
- השתמש במשפטים קצרים וברורים
- אחרי 2-3 שאלות, הודע שאתה בונה את היצירה
- כשאתה מוכן לבנות, סיים את התשובה שלך במילה "🎨יוצר🎨" (זה יגרום למערכת להציג את היצירה)

## סוגי יצירות:
- משחק/לשחק/בלונים -> משחק אינטראקטיבי
- ציור/לצייר/צבעים -> לוח ציור
- סיפור/ספר לי -> סיפור מאויר`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Build messages with conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || 'סליחה, לא הבנתי. אפשר לנסות שוב?';

    // Check if the AI is ready to create (contains the magic word)
    const shouldCreate = response.includes('🎨יוצר🎨');
    const cleanResponse = response.replace('🎨יוצר🎨', '').trim();

    return NextResponse.json({
      response: cleanResponse,
      shouldCreate
    });

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
