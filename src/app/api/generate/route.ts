import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CODE_GENERATION_PROMPT = `אתה מפתח משחקים ואפליקציות מומחה לילדים. התפקיד שלך הוא ליצור קוד HTML/CSS/JavaScript מדהים, מעוצב ועובד בקובץ אחד.

## עקרונות יסוד:
- Pure JavaScript + Canvas API - בלי שום ספרייה חיצונית!
- בנה "מנוע משחק מיני" בעצמך בסגנון פשוט וברור
- הקוד חייב לעבוד בתוך iframe

## למשחקים - השתמש ב-Canvas API:
\`\`\`javascript
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// פונקציות עזר בסיסיות לבנות:
function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function text(str, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = size + 'px Arial';
  ctx.fillText(str, x, y);
}

function collides(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// לולאת משחק:
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// קלט מקלדת:
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);
\`\`\`

## הנחיות עיצוב:
1. עיצוב מודרני, צבעוני ומרהיב - גרדיאנטים, צלליות, אנימציות
2. פונטים גדולים וברורים לילדים
3. כפתורים גדולים עם אפקטי hover יפים
4. שימוש נרחב ב-emojis להנפשה
5. צבעים עליזים ומזמינים

## מבנה נדרש למשחק:
\`\`\`html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: Arial, sans-serif;
    }
    #game-container {
      text-align: center;
      background: white;
      padding: 20px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    #game {
      border: 4px solid #333;
      border-radius: 10px;
      background: #222;
    }
    h1 { color: #333; margin-bottom: 10px; }
    .score { font-size: 24px; color: #667eea; margin: 10px 0; }
    .btn {
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
    .btn:hover { transform: scale(1.1); }
  </style>
</head>
<body>
  <div id="game-container">
    <h1>🎮 שם המשחק</h1>
    <div class="score">ניקוד: <span id="score">0</span></div>
    <canvas id="game" width="400" height="400"></canvas>
    <div>
      <button class="btn" onclick="startGame()">🚀 התחל משחק</button>
    </div>
    <p style="margin-top:10px;color:#666;">השתמש בחצים לתנועה</p>
  </div>
  <script>
    // כל הקוד של המשחק כאן
  </script>
</body>
</html>
\`\`\`

## סוגי משחקים לדוגמה:
1. **משחק קפיצות/פלטפורמה**: דמות קופצת, נמנעת ממכשולים, אוספת מטבעות
2. **משחק יריות**: חללית יורה באויבים
3. **משחק מרוץ**: רכב נמנע ממכשולים
4. **משחק אוסף**: לאסוף פריטים ולהימנע מדברים רעים
5. **משחק נחש**: נחש קלאסי
6. **משחק פאזל**: התאמת צבעים או צורות

## חשוב מאוד:
- התאם את היצירה בדיוק למה שהילד ביקש
- הוסף אפקטים קוליים פשוטים עם Web Audio API (אופציונלי)
- הוסף חלקיקים/אפקטים ויזואליים
- וודא שיש לולאת משחק עובדת עם requestAnimationFrame
- הוסף מצבי משחק: menu, playing, gameOver
- הצג ניקוד ו-high score
- וודא שהקוד עובד ללא שגיאות

## לאפליקציות שאינן משחקים:
השתמש ב-HTML/CSS/JavaScript רגיל עם אנימציות CSS ואינטראקטיביות.

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
          content: `${CODE_GENERATION_PROMPT}\n\n## השיחה עם הילד:\n${conversationSummary}\n\nעל בסיס השיחה, צור את היצירה המושלמת שהילד ביקש. אם זה משחק - השתמש ב-Canvas API עם מנוע משחק מיני. הקוד צריך להיות מעוצב יפהפה ולעבוד מושלם!`
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
