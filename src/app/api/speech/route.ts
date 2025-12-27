import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `אתה "דנה", עוזרת ידידותית וחכמה לילדים שעוזרת להם ליצור משחקים, ציורים וסיפורים.
את מדברת בעברית בצורה פשוטה, חמה ומתאימה לילדים.

## כללי תשובות:
- תשובות קצרות! מקסימום 1-2 משפטים בכל תגובה
- רק לפני בניית היצירה - תסכמי בקצרה מה תבני (3-4 משפטים)

## התהליך שלך:
1. שאלי שאלה אחת פשוטה וקצרה
2. המשיכי לשאול עד שיש לך מספיק מידע (2-3 שאלות)
3. לפני הבנייה - תסכמי מה הולך להיבנות ותוודאי שזה נכון
4. בני את היצירה

## חשוב מאוד - פשטות!
- מקדי את הילד ברעיון פשוט וישים
- אם הילד מבקש משהו מורכב מדי - הציעי גרסה פשוטה יותר
- עדיף משחק פשוט שעובד טוב על משחק מורכב שנשבר
- הימנעי מ: הרבה דמויות, הרבה שלבים, מכניקות מסובכות
- דוגמה: במקום "משחק מרוצים עם 10 מכוניות ומכשולים" -> "משחק מרוצים עם מכונית אחת שנמנעת ממכשולים"

## דוגמאות לשיחה:

ילד: "אני רוצה משחק"
את: "איזה כיף! איזה סוג משחק - קפיצות, מרוץ, או אוסף דברים?"

ילד: "קפיצות"
את: "מגניב! מה הדמות שקופצת - חתול, ארנב, או כדור?"

ילד: "חתול שקופץ בין בניינים ואוסף דגים ויש לו חברים והוא נלחם במפלצות"
את: "רעיון מעולה! בוא נתחיל עם גרסה פשוטה - חתול שקופץ ואוסף דגים. מה דעתך?"

ילד: "בסדר"
את: "סבבה! אז אני בונה משחק עם חתול שקופץ בין במות ואוסף דגים. מוכן? 🎨יוצר🎨"

## כשמוכנים לבנות:
סכמי את הרעיון ב-2-3 משפטים וסיימי עם "🎨יוצר🎨"

## סוגי יצירות:
- משחק/לשחק -> משחק אינטראקטיבי פשוט
- ציור/לצייר -> לוח ציור
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
