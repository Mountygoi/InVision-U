import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

export interface SJTAnswer {
  scenarioId: number;
  chosenOption: string;
  explanation: string;
}

export interface SJTScenarioResult {
  scenarioId: number;
  feedback: string;
  scores: {
    leadership: number;
    problemSolving: number;
    teamwork: number;
    stressResilience: number;
    ethics: number;
  };
}

export interface SJTAnalysisResult {
  overallScores: {
    leadership: number;
    problemSolving: number;
    teamwork: number;
    stressResilience: number;
    ethics: number;
  };
  scenarioResults: SJTScenarioResult[];
  personalitySummary: string;
  modelVersion: string;
  analyzedAt: string;
}

const SJT_SYSTEM_PROMPT = `You are an expert psychologist and talent evaluator for InVision U, a prestigious scholarship program in Kazakhstan for young tech leaders.

You will receive a candidate's answers to 4 Situational Judgement Test (SJT) scenarios. Each answer includes the chosen option (A/B/C/D) and a free-text explanation.

Your task is to evaluate each scenario response and provide:
1. Per-scenario feedback (2-3 sentences in Russian) explaining what the choice reveals about the candidate
2. Per-scenario scores (0-100) for: leadership, problemSolving, teamwork, stressResilience, ethics
3. Overall aggregated scores (0-100) for the same 5 dimensions
4. A personality insight summary (3-4 sentences in Russian)

Scoring guidelines:
- Scenario 1 (Leadership Crisis): Best answer is A (proactive leadership). B is passive, C is avoidant, D is reasonable but not leadership-oriented.
- Scenario 2 (Ethical Dilemma): Best answer is B (balanced ethics + pragmatism). A is unethical, C is rigid, D is heroic but impractical.
- Scenario 3 (Resource Constraint): Best answer is B (creative problem-solving). A is defeatist, C shifts responsibility, D ignores constraints.
- Scenario 4 (Failure Recovery): Best answer is B (resilience + action). A avoids learning, C blames others, D gives up.

However, the explanation matters too — a candidate who picks a "suboptimal" option but provides thoughtful reasoning should score higher than one who picks the "best" option with shallow reasoning.

Return ONLY valid JSON in this exact format:
{
  "scenarioResults": [
    {
      "scenarioId": 1,
      "feedback": "...",
      "scores": { "leadership": 0, "problemSolving": 0, "teamwork": 0, "stressResilience": 0, "ethics": 0 }
    }
  ],
  "overallScores": { "leadership": 0, "problemSolving": 0, "teamwork": 0, "stressResilience": 0, "ethics": 0 },
  "personalitySummary": "..."
}`;

function buildSJTPrompt(answers: SJTAnswer[]): string {
  const scenarios: Record<number, string> = {
    1: 'Leadership Crisis: Команда с дедлайном, тимлид заболел, двое конфликтуют',
    2: 'Ethical Dilemma: Друг скопировал код без указания авторства, до презентации 3 часа',
    3: 'Resource Constraint: MVP для сельской школы без бюджета, слабый интернет, старые телефоны',
    4: 'Failure Recovery: Стартап провалился на демо-дне, приложение упало',
  };

  const optionLabels: Record<number, Record<string, string>> = {
    1: {
      A: 'Возьму на себя роль лидера, распределю задачи и поговорю с конфликтующими',
      B: 'Напишу тимлиду и попрошу решить конфликт удалённо',
      C: 'Буду работать над своей частью и надеяться что другие разберутся',
      D: 'Предложу перенести дедлайн',
    },
    2: {
      A: 'Промолчу — друг важнее',
      B: 'Поговорю с другом наедине и предложу указать источник или переписать',
      C: 'Сообщу преподавателю немедленно',
      D: 'Перепишу код сам за 3 часа',
    },
    3: {
      A: 'Откажусь от проекта',
      B: 'Сделаю offline-first PWA с оптимизацией',
      C: 'Попрошу школу купить новые устройства',
      D: 'Сделаю обычное веб-приложение',
    },
    4: {
      A: 'Забуду этот проект и начну новый',
      B: 'Проанализирую ошибки, починю баги, запишу видео-демо и разошлю инвесторам',
      C: 'Обвиню команду',
      D: 'Решу что стартапы не для меня',
    },
  };

  let prompt = 'Candidate SJT Answers:\n\n';
  for (const answer of answers) {
    const scenarioDesc = scenarios[answer.scenarioId] || `Scenario ${answer.scenarioId}`;
    const optionDesc = optionLabels[answer.scenarioId]?.[answer.chosenOption] || answer.chosenOption;
    prompt += `Scenario ${answer.scenarioId} (${scenarioDesc}):\n`;
    prompt += `Chosen: ${answer.chosenOption}) ${optionDesc}\n`;
    prompt += `Explanation: ${answer.explanation || '(no explanation provided)'}\n\n`;
  }

  return prompt;
}

export async function analyzeSJT(answers: SJTAnswer[]): Promise<SJTAnalysisResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const userPrompt = buildSJTPrompt(answers);

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system' as const, content: SJT_SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2000,
  });

  const responseText = completion.choices[0]?.message?.content || '{}';

  // Clean + parse JSON
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
    console.error('SJT JSON parse error:', e.message);
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\n/g, '\\n');
    parsed = JSON.parse(jsonStr);
  }

  if (!parsed.overallScores || !parsed.scenarioResults || !parsed.personalitySummary) {
    throw new Error('Invalid SJT AI response structure');
  }

  return {
    overallScores: parsed.overallScores,
    scenarioResults: parsed.scenarioResults,
    personalitySummary: parsed.personalitySummary,
    modelVersion: `groq-${MODEL}`,
    analyzedAt: new Date().toISOString(),
  };
}
