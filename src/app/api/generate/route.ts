import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CODE_GENERATION_PROMPT = `אתה מפתח אפליקציות ומשחקים מומחה לילדים. התפקיד שלך הוא ליצור קוד HTML/CSS/JavaScript מדהים, מעוצב ועובד בקובץ אחד.

## עקרונות יסוד:
- הקוד חייב לעבוד בתוך iframe
- פשטות! קוד פשוט שעובד עדיף על קוד מורכב שנשבר
- עיצוב מרהיב עם גרדיאנטים, צלליות, ואנימציות CSS
- השתמש ב-emojis לגרפיקה יפה וצבעונית

## למשחקים - השתמש ב-Pure JavaScript + Canvas API:
\`\`\`html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .game-wrapper {
      text-align: center;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    h1 {
      color: #fff;
      font-size: 28px;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .score {
      color: #ffd700;
      font-size: 22px;
      margin-bottom: 15px;
      font-weight: bold;
    }
    canvas {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 12px 28px;
      font-size: 18px;
      border-radius: 25px;
      cursor: pointer;
      margin: 15px 5px 0;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(102,126,234,0.4);
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102,126,234,0.6); }
    .instructions {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="game-wrapper">
    <h1>🎮 שם המשחק</h1>
    <div class="score">⭐ ניקוד: <span id="score">0</span></div>
    <canvas id="game" width="500" height="400"></canvas>
    <div>
      <button class="btn" onclick="startGame()">🚀 התחל משחק</button>
    </div>
    <p class="instructions">🎯 השתמש בחצים או עכבר לשחק</p>
  </div>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let score = 0;
    let gameRunning = false;
    let animationId;

    // ציור רקע יפה עם גרדיאנט
    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#2d1b69');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // כוכבים קטנים ברקע
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for(let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ציור טקסט/emoji גדול
    function drawEmoji(emoji, x, y, size) {
      ctx.font = size + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y);
    }

    // ציור עיגול צבעוני עם צל
    function drawCircle(x, y, r, color) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ציור מלבן עם פינות מעוגלות
    function drawRoundRect(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    }

    // בדיקת התנגשות
    function collides(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // עדכון ניקוד
    function updateScore(points) {
      score += points;
      document.getElementById('score').textContent = score;
    }

    // מסך Game Over
    function gameOver() {
      gameRunning = false;
      cancelAnimationFrame(animationId);

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎮 המשחק נגמר!', canvas.width/2, canvas.height/2 - 30);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('⭐ ניקוד: ' + score, canvas.width/2, canvas.height/2 + 20);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText('לחץ על "התחל משחק" לנסות שוב', canvas.width/2, canvas.height/2 + 60);
    }

    function startGame() {
      score = 0;
      document.getElementById('score').textContent = '0';
      gameRunning = true;
      // אתחל את המשחק כאן
      gameLoop();
    }

    function update() {
      // לוגיקת המשחק כאן
    }

    function draw() {
      drawBackground();
      // ציור אלמנטים כאן
    }

    function gameLoop() {
      if (!gameRunning) return;
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    }

    // קלט מקלדת
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
    document.addEventListener('keyup', e => keys[e.key] = false);

    // קלט עכבר
    let mouseX = 0, mouseY = 0;
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('click', e => {
      // טיפול בלחיצה
    });

    // ציור מסך התחלתי
    drawBackground();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 לחץ "התחל משחק" לשחק!', canvas.width/2, canvas.height/2);
  </script>
</body>
</html>
\`\`\`

## לאפליקציות אחרות (דף נחיתה, ציור, סיפור, כלים):
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
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 600px;
      width: 100%;
    }
    h1 {
      color: #333;
      font-size: 32px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #666; font-size: 18px; line-height: 1.6; margin-bottom: 20px; }
    .btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 15px 35px;
      font-size: 18px;
      border-radius: 30px;
      cursor: pointer;
      margin: 10px;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(102,126,234,0.4);
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102,126,234,0.5);
    }
    .emoji-big { font-size: 64px; margin: 20px 0; }
    .card {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
      padding: 20px;
      border-radius: 16px;
      margin: 15px 0;
      transition: transform 0.3s;
    }
    .card:hover { transform: scale(1.02); }
    input, textarea {
      width: 100%;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 16px;
      margin: 10px 0;
      transition: border-color 0.3s;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }
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

## טיפים לגרפיקה יפה:
1. **השתמש ב-emojis כגרפיקה**: 🎮 🚀 ⭐ 💎 🎯 🏆 ❤️ 🔥 ✨ 🌟 🎨 🎪
2. **גרדיאנטים**: linear-gradient ו-radial-gradient לרקעים יפים
3. **צלליות**: box-shadow ו-text-shadow לעומק
4. **אנימציות CSS**: transition ו-@keyframes לתנועה חלקה
5. **blur effects**: backdrop-filter: blur() לאפקט זכוכית

## חשוב מאוד:
- וודא שהקוד עובד ללא שגיאות
- אל תשתמש בפונקציות שלא הגדרת (כמו flash או burp)
- השתמש רק ב-Canvas API רגיל (fillRect, arc, fillText וכו')
- התאם את היצירה בדיוק למה שהילד ביקש
- עיצוב מרהיב עם צבעים עליזים

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
          content: `${CODE_GENERATION_PROMPT}\n\n## השיחה עם הילד:\n${conversationSummary}\n\nעל בסיס השיחה, צור את היצירה המושלמת שהילד ביקש. השתמש ב-Pure JavaScript + Canvas API למשחקים, או HTML/CSS/JS לאפליקציות אחרות. וודא שהקוד עובד מושלם ללא שגיאות, עם עיצוב מרהיב!`
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
