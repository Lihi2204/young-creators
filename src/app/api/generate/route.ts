import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CODE_GENERATION_PROMPT = `אתה מפתח אפליקציות מומחה לילדים. התפקיד שלך הוא ליצור קוד HTML/CSS/JavaScript מדהים, מעוצב ועובד בקובץ אחד.

## הנחיות עיצוב:
1. עיצוב מודרני, צבעוני ומרהיב - השתמש בגרדיאנטים, צלליות, ואנימציות
2. פונטים גדולים וברורים לילדים
3. כפתורים גדולים עם אפקטי hover יפים
4. אנימציות חלקות ומהנות (CSS animations/transitions)
5. שימוש נרחב ב-emojis להנפשה
6. צבעים עליזים ומזמינים

## הנחיות טכניות:
1. צור קובץ HTML שלם עם כל ה-CSS וה-JavaScript בתוכו (inline)
2. השתמש בעברית לכל הטקסט
3. הקוד חייב להיות אינטראקטיבי ועובד מושלם
4. הכל חייב לעבוד בתוך iframe
5. אל תשתמש בספריות חיצוניות - הכל standalone
6. וודא שהמשחק/יצירה עובדים בצורה מושלמת

## מבנה נדרש:
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    /* CSS מעוצב כאן */
  </style>
</head>
<body>
  <!-- HTML כאן -->
  <script>
    // JavaScript כאן
  </script>
</body>
</html>

## חשוב מאוד:
- התאם את היצירה בדיוק למה שהילד ביקש
- הוסף פיצ'רים קטנים שישמחו את הילד
- וודא שהקוד עובד ללא שגיאות
- צור חוויה מהנה ומרגשת

החזר רק את קוד ה-HTML, בלי הסברים נוספים.`;

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Build detailed summary of what the child wants
    const conversationSummary = conversationHistory
      .map((msg: { role: string; content: string }) =>
        `${msg.role === 'user' ? 'ילד' : 'יוצר'}: ${msg.content}`
      )
      .join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `${CODE_GENERATION_PROMPT}\n\n## השיחה עם הילד:\n${conversationSummary}\n\nעל בסיס השיחה, צור את היצירה המושלמת שהילד ביקש. הקוד צריך להיות מעוצב יפהפה ולעבוד מושלם!`
        }
      ],
    });

    let code = message.content[0].type === 'text' ? message.content[0].text : '';

    // Clean up the code - remove markdown code blocks if present
    code = code.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();

    // Ensure it starts with DOCTYPE
    if (!code.toLowerCase().includes('<!doctype')) {
      code = `<!DOCTYPE html>\n<html lang="he" dir="rtl">\n<head><meta charset="UTF-8"></head>\n<body>${code}</body>\n</html>`;
    }

    return NextResponse.json({ code });

  } catch (error: any) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 }
    );
  }
}
