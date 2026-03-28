import Anthropic from '@anthropic-ai/sdk';
import { ESSAY_ANALYSIS_SYSTEM_PROMPT, buildEssayAnalysisPrompt } from './prompts.js';
import type { AIAnalysisResult, AIScores, AIFlags, Achievement } from '../types.js';

const MODEL = 'claude-haiku-4-5-20251001';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function analyzeEssay(
  essayText: string,
  candidateName: string,
  achievements: Achievement[],
  university: string,
  city: string
): Promise<AIAnalysisResult> {
  const anthropic = getClient();

  const achievementsStr = achievements.length > 0
    ? achievements.map(a => `${a.type}: ${a.title}${a.description ? ' - ' + a.description : ''}`).join('; ')
    : 'None listed';

  const userMessage = buildEssayAnalysisPrompt(
    essayText,
    candidateName,
    achievementsStr,
    university,
    city
  );

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: ESSAY_ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate structure
  const scores = parsed.scores as AIScores;
  const flags = parsed.flags as AIFlags;
  const summary = parsed.summary as string;

  if (!scores || !flags || !summary) {
    throw new Error('Invalid AI response structure');
  }

  return {
    scores,
    flags,
    summary,
    modelVersion: MODEL,
    analyzedAt: new Date().toISOString(),
  };
}

export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
