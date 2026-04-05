import { getGroqClient, GROQ_MODEL } from './constants.js';

const LEARNABILITY_SYSTEM_PROMPT = `Ты — AI-аналитик программы inVision U. Твоя задача: проанализировать обучаемость (coachability) кандидата.

Тебе дают:
1. ИСХОДНОЕ ЭССЕ — первоначальный текст кандидата (ДО подсказок AI)
2. ПОДСКАЗКИ AI — вопросы, которые AI задал кандидату для улучшения заявки
3. ОТВЕТЫ КАНДИДАТА — как кандидат ответил на подсказки
4. ДОСТИЖЕНИЯ и НАВЫКИ — дополнительные данные

### ИЗМЕРЕНИЯ ОЦЕНКИ (0–100 каждое):

1. **coachability** (Обучаемость):
   - Насколько кандидат улучшил качество заявки после подсказок?
   - Ответил ли содержательно или формально/коротко?
   - Применил ли советы или проигнорировал?
   - 90–100: Значительно обогатил ответы, добавил конкретику, примеры
   - 60–80: Ответил нормально, но без глубины
   - 0–50: Формальные ответы, проигнорировал подсказки

2. **leadershipPotential** (Лидерский потенциал):
   - Реальные сигналы лидерства: инициатива, создание чего-то, помощь другим, ответственность
   - НЕ шаблонные фразы ("я лидер", "хочу менять мир"), а конкретные примеры
   - 90–100: Явные примеры инициативы и влияния
   - 60–80: Есть намёки, но не конкретные
   - 0–50: Шаблонные заявления без примеров

3. **growthTrajectory** (Пройденный путь):
   - Траектория роста: откуда кандидат начал и куда пришёл
   - Ребёнок из сельской школы, который сам выучил Python → выше, чем НИШ-ник с репетиторами
   - 90–100: Явная история преодоления, self-made путь
   - 60–80: Обычная траектория с элементами роста
   - 0–50: Привилегированный путь без преодоления

4. **authenticity** (Аутентичность):
   - Детектирование AI-генерированного текста
   - Признаки ChatGPT: идеально гладкий стиль, отсутствие ошибок, шаблонные обороты, "В заключение", "Я верю что..."
   - Признаки настоящего текста: разговорный стиль, нестандартные обороты, конкретные детали, эмоции
   - 90–100: Явно аутентичный текст с личным голосом
   - 60–80: В основном аутентичный, небольшие сомнения
   - 0–50: Высокая вероятность AI-генерации

5. **engagement** (Вовлечённость):
   - Глубина и конкретика ответов на подсказки
   - Длина ответов, наличие примеров, деталей, эмоций
   - 90–100: Развёрнутые ответы с конкретикой
   - 60–80: Средние ответы
   - 0–50: Отписки или пропуски

6. **selfAwareness** (Самоосознание):
   - Понимание своих сильных и слабых сторон
   - Реалистичность оценки своего опыта
   - 90–100: Зрелая рефлексия, понимание ограничений
   - 60–80: Базовая самооценка
   - 0–50: Отсутствие рефлексии или завышенная самооценка

### ФОРМАТ ОТВЕТА (СТРОГО JSON):
{
  "dimensions": [
    { "key": "coachability", "score": 85, "evidence": "Конкретная цитата или наблюдение" },
    { "key": "leadershipPotential", "score": 70, "evidence": "..." },
    { "key": "growthTrajectory", "score": 60, "evidence": "..." },
    { "key": "authenticity", "score": 90, "evidence": "..." },
    { "key": "engagement", "score": 75, "evidence": "..." },
    { "key": "selfAwareness", "score": 65, "evidence": "..." }
  ],
  "overallScore": 74,
  "beforeSummary": "До подсказок: краткая характеристика исходного эссе (1-2 предложения)",
  "afterSummary": "После подсказок: как изменилось качество заявки (1-2 предложения)",
  "verdict": "high|medium|low",
  "verdictText": "Краткий итог обучаемости (1-2 предложения на русском)"
}

### ПРАВИЛА:
- overallScore = среднее всех 6 измерений
- verdict: "high" если overallScore >= 75, "medium" если >= 50, "low" если < 50
- evidence: конкретные цитаты или факты, НЕ общие фразы
- Если нет ответов на подсказки — coachability и engagement оценить на 0
- Отвечай ТОЛЬКО JSON, без markdown`;

interface LearnabilityRequest {
  essayText: string;
  nudgeAnswers: { questionId: string; question: string; type: string; answer: string }[];
  achievements?: { type: string; title: string; description?: string }[];
  skills?: string[];
  name?: string;
}

export interface LearnabilityDimension {
  key: string;
  score: number;
  evidence: string;
}

export interface LearnabilityResult {
  dimensions: LearnabilityDimension[];
  overallScore: number;
  beforeSummary: string;
  afterSummary: string;
  verdict: 'high' | 'medium' | 'low';
  verdictText: string;
}

export async function analyzeLearnability(data: LearnabilityRequest): Promise<LearnabilityResult> {
  const userContent = `
### ИСХОДНОЕ ЭССЕ (ДО подсказок):
${data.essayText || '(Эссе не предоставлено)'}

### ПОДСКАЗКИ AI И ОТВЕТЫ КАНДИДАТА:
${data.nudgeAnswers.length > 0
    ? data.nudgeAnswers.map((a, i) =>
        `Вопрос ${i + 1}: ${a.question}\nОтвет кандидата: ${a.answer}`
      ).join('\n\n')
    : '(Кандидат не ответил ни на один вопрос)'
  }

### ДОСТИЖЕНИЯ:
${data.achievements?.length
    ? data.achievements.map(a => `- ${a.type}: ${a.title}${a.description ? ' — ' + a.description : ''}`).join('\n')
    : '(Нет достижений)'
  }

### НАВЫКИ:
${data.skills?.length ? data.skills.join(', ') : '(Не указаны)'}

### ИМЯ КАНДИДАТА: ${data.name || 'Неизвестно'}

Проанализируй обучаемость кандидата и верни JSON.`;

  const response = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: LEARNABILITY_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content || '{}';
  
  try {
    const parsed = JSON.parse(raw) as LearnabilityResult;
    
    // Validate and sanitize
    if (!parsed.dimensions || !Array.isArray(parsed.dimensions)) {
      throw new Error('Invalid dimensions format');
    }
    
    // Ensure all dimensions exist
    const requiredKeys = ['coachability', 'leadershipPotential', 'growthTrajectory', 'authenticity', 'engagement', 'selfAwareness'];
    for (const key of requiredKeys) {
      if (!parsed.dimensions.find(d => d.key === key)) {
        parsed.dimensions.push({ key, score: 50, evidence: 'Недостаточно данных' });
      }
    }
    
    // Clamp scores 0-100
    parsed.dimensions = parsed.dimensions.map(d => ({
      ...d,
      score: Math.max(0, Math.min(100, Math.round(d.score))),
    }));
    
    // Recalculate overall
    parsed.overallScore = Math.round(
      parsed.dimensions.reduce((sum, d) => sum + d.score, 0) / parsed.dimensions.length
    );
    
    // Ensure verdict is correct
    if (parsed.overallScore >= 75) parsed.verdict = 'high';
    else if (parsed.overallScore >= 50) parsed.verdict = 'medium';
    else parsed.verdict = 'low';
    
    return parsed;
  } catch (parseErr) {
    console.error('Learnability parse error:', parseErr, 'Raw:', raw);
    throw new Error('Failed to parse learnability analysis');
  }
}
