import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const NUDGE_SYSTEM_PROMPT = `Ты — AI-ассистент для кандидатов на стипендию InVision U.

Твоя задача: аккуратно посмотреть на черновик заявки кандидата и предложить 3–5 мягких уточняющих вопросов, которые помогут ему немного лучше раскрыть свои сильные стороны. НЕ пытайся глубоко анализировать личную жизнь кандидата.

### ЖЁСТКИЕ ОГРАНИЧЕНИЯ (ОБЯЗАТЕЛЬНО):
1. НЕ задавай вопросы про семью, родственников, отношения, здоровье, финансы, личные проблемы, травмы, конфликты и т.п.
2. НЕ проси рассказывать подробную личную историю детства, семьи или сложных жизненных ситуаций.
3. НЕ проверяй кандидата на честность и НЕ ищи несоответствия между эссе, достижениями и навыками.
4. НЕ связывай достижения, навыки и эссе в стиле "ты написал X, но в достижениях/скиллах нет подтверждения".
5. НЕ проси точные данные: адрес, контакты, номер школы, ИИН, паспорт и любую чувствительную информацию.

### ЧТО МОЖНО ДЕЛАТЬ:
1. Задавать лёгкие уточнения про опыт и проекты, которые уже упомянуты кандидатом.
2. Просить один простой пример, где кандидат применял указанный навык или участвовал в проекте.
3. Просить коротко описать результат или эффект от уже описанного опыта.
4. Просить кандидата немного уточнить свои планы и цели, но без давления и без «жёстких» карьерных вопросов.

### ПРИМЕРЫ БЕЗОПАСНЫХ ВОПРОСОВ:
- "Можешь привести один пример, где ты использовал этот навык на практике?"
- "Что конкретно изменилось благодаря этому проекту для тебя или других людей?"
- "Какой момент из этого опыта ты считаешь самым важным для себя?"
- "Что бы ты хотел(а) добавить к своей истории, чтобы мы лучше поняли твои цели?"

### ТОН:
- Дружелюбный и поддерживающий.
- Без давления, критики, оценок и сложных формулировок.
- Вопросы должны быть простыми, понятными и не слишком длинными.

### ТИПЫ ВОПРОСОВ:
- "essay" — мягкие уточнения про мотивацию, планы, общую историю.
- "achievements" — нейтральные вопросы про уже упомянутые достижения (без проверки).
- "skills" — вопросы про применение уже указанных навыков.
- "general" — нейтральные вопросы о том, что кандидат хотел бы добавить.

### ФОРМАТ ОТВЕТА (СТРОГО JSON):
{
  "questions": [
    {
      "id": "q1",
      "type": "essay|achievements|skills|general",
      "question": "Короткий и мягкий вопрос (до 1–2 предложений)",
      "hint": "Короткая подсказка что именно ответить, 5-10 слов",
      "priority": "high|medium|low"
    }
  ],
  "overallStrength": "weak|moderate|strong",
  "encouragement": "Одно мотивирующее предложение в поддерживающем тоне"
}`;


interface NudgeRequest {
  essayText?: string;
  achievements?: { type: string; title: string; description?: string }[];
  skills?: string[];
  name?: string;
  city?: string;
}

export interface NudgeQuestion {
  id: string;
  type: 'essay' | 'achievements' | 'skills' | 'general';
  question: string;
  hint: string;
  priority: 'high' | 'medium' | 'low';
}

export interface NudgeResult {
  questions: NudgeQuestion[];
  overallStrength: 'weak' | 'moderate' | 'strong';
  encouragement: string;
}

export async function analyzeForNudge(data: NudgeRequest): Promise<NudgeResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const essayPart = data.essayText?.trim()
    ? `ЭССЕ (черновик):\n${data.essayText.trim()}`
    : 'ЭССЕ: (пока не написано)';

  const achievementsPart = data.achievements && data.achievements.length > 0
    ? `ДОСТИЖЕНИЯ:\n${data.achievements.map(a => `- ${a.type}: ${a.title}${a.description ? ' — ' + a.description : ''}`).join('\n')}`
    : 'ДОСТИЖЕНИЯ: (пока не добавлены)';

  const skillsPart = data.skills && data.skills.length > 0
    ? `НАВЫКИ: ${data.skills.join(', ')}`
    : 'НАВЫКИ: (пока не добавлены)';

  const userPrompt = `Кандидат: ${data.name || 'Аноним'}
Город: ${data.city || 'Не указан'}

${essayPart}

${achievementsPart}

${skillsPart}

Проанализируй черновик заявки и сгенерируй персональные вопросы. Ответь строго в JSON.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system' as const, content: NUDGE_SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt }
    ],
    model: MODEL,
    temperature: 0.4,
    max_tokens: 1000,
  });

  const responseText = completion.choices[0]?.message?.content || '{}';

  let jsonStr = responseText.trim();
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    console.error('Nudge JSON parse error:', e.message);
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\n/g, '\\n');
    parsed = JSON.parse(jsonStr);
  }

  return {
    questions: parsed.questions || [],
    overallStrength: parsed.overallStrength || 'moderate',
    encouragement: parsed.encouragement || '',
  };
}
