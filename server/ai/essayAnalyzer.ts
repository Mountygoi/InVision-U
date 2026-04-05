import { ESSAY_ANALYSIS_SYSTEM_PROMPT, buildEssayAnalysisPrompt } from './prompts.js';
import { getGroqClient, GROQ_MODEL, parseAIJson } from './constants.js';
import type { AIAnalysisResult, AIScores, AIFlags, Achievement } from '../types.js';

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await getGroqClient().chat.completions.create({
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    model: GROQ_MODEL,
    temperature: 0.3,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || '{}';
}

export async function analyzeEssay(
  essayText: string,
  candidateName: string,
  achievements: Achievement[],
  university: string,
  city: string,
  nudgeAnswersText?: string
): Promise<AIAnalysisResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const achievementsStr = achievements.length > 0
    ? achievements.map(a => `${a.type}: ${a.title}${a.description ? ' - ' + a.description : ''}`).join('; ')
    : 'None listed';

  const extraPart = nudgeAnswersText?.trim()
    ? `\nДОПОЛНИТЕЛЬНЫЕ ОТВЕТЫ КАНДИДАТА НА УТОЧНЯЮЩИЕ ВОПРОСЫ:\n${nudgeAnswersText.trim()}`
    : '';

  const userMessage = buildEssayAnalysisPrompt(
    essayText + extraPart,
    candidateName,
    achievementsStr,
    university,
    city
  );

  const responseText = await callGroq(ESSAY_ANALYSIS_SYSTEM_PROMPT, userMessage);

  const parsed = parseAIJson<{ scores: AIScores; flags: AIFlags; summary: string }>(responseText);

  if (!parsed.scores || !parsed.flags || !parsed.summary) {
    throw new Error('Invalid AI response structure');
  }

  return {
    scores: parsed.scores,
    flags: parsed.flags,
    summary: parsed.summary,
    modelVersion: `groq-${GROQ_MODEL}`,
    analyzedAt: new Date().toISOString(),
  };
}

export function isAIAvailable(): boolean {
  return !!process.env.GROQ_API_KEY;
}