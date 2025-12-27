import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CODE_GENERATION_PROMPT = `אתה מפתח משחקים ואפליקציות מומחה לילדים. התפקיד שלך הוא ליצור קוד HTML/CSS/JavaScript מדהים, מעוצב ועובד בקובץ אחד.

## עקרונות יסוד:
- למשחקים: השתמש ב-Kaboom.js (ספריית משחקים פשוטה וחזקה)
- הקוד חייב לעבוד בתוך iframe
- פשטות! משחק פשוט שעובד עדיף על משחק מורכב שנשבר

## למשחקים - השתמש ב-Kaboom.js:
\`\`\`html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      overflow: hidden;
      background: #1a1a2e;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="https://unpkg.com/kaboom@3000.1.17/dist/kaboom.js"></script>
  <script>
    // אתחול Kaboom
    kaboom({
      width: 600,
      height: 400,
      background: [50, 50, 80],
      scale: 1,
      crisp: true,
    });

    // הגדרת רכיבים גרפיים עם צורות
    // ריבוע צבעוני
    loadSprite("player", "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#4ECDC4" rx="4"/><circle cx="10" cy="12" r="3" fill="#333"/><circle cx="22" cy="12" r="3" fill="#333"/><path d="M10 22 Q16 28 22 22" stroke="#333" stroke-width="2" fill="none"/></svg>'));

    // כוכב/מטבע
    loadSprite("coin", "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#FFD700"/><circle cx="12" cy="12" r="6" fill="#FFA500"/></svg>'));

    // מכשול
    loadSprite("obstacle", "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#FF6B6B" rx="2"/><line x1="8" y1="8" x2="24" y2="24" stroke="#fff" stroke-width="3"/><line x1="24" y1="8" x2="8" y2="24" stroke="#fff" stroke-width="3"/></svg>'));

    let score = 0;

    // סצנת משחק
    scene("game", () => {
      // רקע
      add([
        rect(width(), height()),
        pos(0, 0),
        color(50, 50, 80),
        fixed(),
      ]);

      // שחקן
      const player = add([
        sprite("player"),
        pos(80, 200),
        area(),
        body(),
        "player",
      ]);

      // רצפה
      add([
        rect(width(), 40),
        pos(0, height() - 40),
        color(100, 100, 120),
        area(),
        body({ isStatic: true }),
        "floor",
      ]);

      // ניקוד
      const scoreText = add([
        text("ניקוד: 0", { size: 24 }),
        pos(24, 24),
        fixed(),
      ]);

      // תנועה וקפיצה
      onKeyDown("right", () => player.move(200, 0));
      onKeyDown("left", () => player.move(-200, 0));
      onKeyPress("space", () => {
        if (player.isGrounded()) {
          player.jump(400);
        }
      });
      onKeyPress("up", () => {
        if (player.isGrounded()) {
          player.jump(400);
        }
      });

      // יצירת מטבעות
      loop(1.5, () => {
        add([
          sprite("coin"),
          pos(width(), rand(100, height() - 100)),
          area(),
          move(LEFT, 150),
          offscreen({ destroy: true }),
          "coin",
        ]);
      });

      // יצירת מכשולים
      loop(2.5, () => {
        add([
          sprite("obstacle"),
          pos(width(), height() - 72),
          area(),
          move(LEFT, 200),
          offscreen({ destroy: true }),
          "obstacle",
        ]);
      });

      // איסוף מטבעות
      onCollide("player", "coin", (p, c) => {
        destroy(c);
        score += 10;
        scoreText.text = "ניקוד: " + score;
        burp(); // צליל
      });

      // פגיעה במכשול
      onCollide("player", "obstacle", () => {
        go("gameover");
      });
    });

    // סצנת סיום
    scene("gameover", () => {
      add([
        rect(width(), height()),
        color(30, 30, 50),
      ]);

      add([
        text("המשחק נגמר!", { size: 48 }),
        pos(center().x, center().y - 60),
        anchor("center"),
      ]);

      add([
        text("ניקוד: " + score, { size: 32 }),
        pos(center().x, center().y),
        anchor("center"),
      ]);

      add([
        text("לחץ SPACE להתחלה מחדש", { size: 24 }),
        pos(center().x, center().y + 60),
        anchor("center"),
      ]);

      onKeyPress("space", () => {
        score = 0;
        go("game");
      });
    });

    // התחלה
    go("game");
  </script>
</body>
</html>
\`\`\`

## הנחיות עיצוב:
1. צבעים עליזים ומזמינים
2. צורות פשוטות (ריבועים, עיגולים) עם צבעים
3. טקסט גדול וברור
4. אנימציות פשוטות

## סוגי משחקים:
1. **משחק קפיצות**: דמות קופצת מעל מכשולים ואוספת מטבעות
2. **משחק אוסף**: לאסוף פריטים שנופלים מלמעלה
3. **משחק מרוץ/הימנעות**: להימנע ממכשולים שמתקרבים
4. **משחק לחיצות**: ללחוץ על דברים שצצים על המסך

## חשוב מאוד:
- פשטות! מכניקה אחת פשוטה
- דמות אחת בלבד
- סוג מכשול אחד או שניים
- וודא שהמשחק מתחיל אוטומטית
- הוסף ניקוד
- הוסף מסך Game Over עם אפשרות להתחיל מחדש

## לאפליקציות שאינן משחקים (ציור, סיפור):
השתמש ב-HTML/CSS/JavaScript רגיל:
\`\`\`html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      text-align: center;
    }
    h1 { color: #333; margin-bottom: 20px; }
    button {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      border-radius: 25px;
      cursor: pointer;
      margin: 10px;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.1); }
  </style>
</head>
<body>
  <div class="container">
    <!-- תוכן כאן -->
  </div>
  <script>
    // קוד כאן
  </script>
</body>
</html>
\`\`\`

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
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: `${CODE_GENERATION_PROMPT}\n\n## השיחה עם הילד:\n${conversationSummary}\n\nעל בסיס השיחה, צור את היצירה המושלמת שהילד ביקש. אם זה משחק - השתמש ב-Kaboom.js. וודא שהמשחק פשוט, עובד מושלם, ומתחיל אוטומטית!`
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
