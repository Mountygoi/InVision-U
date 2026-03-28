import https from 'https';
import { ESSAY_ANALYSIS_SYSTEM_PROMPT, buildEssayAnalysisPrompt } from './prompts.js';
import type { AIAnalysisResult, AIScores, AIFlags, Achievement } from '../types.js';

const MODEL = 'gemini-2.5-flash';

function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return reject(new Error('GEMINI_API_KEY is not set'));
    }

    const body = JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
    });

    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`);

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(`Gemini API error: ${parsed.error.message}`));
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            return reject(new Error('No text in Gemini response'));
          }
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Network error calling Gemini: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

export async function analyzeEssay(
  essayText: string,
  candidateName: string,
  achievements: Achievement[],
  university: string,
  city: string
): Promise<AIAnalysisResult> {
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

  const responseText = await callGemini(userMessage, ESSAY_ANALYSIS_SYSTEM_PROMPT);

  // Extract JSON from response (handle markdown code blocks and thinking tokens)
  let jsonStr = responseText.trim();

  // Try extracting from code block first
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // If still not valid JSON, try finding the JSON object directly
  if (!jsonStr.startsWith('{')) {
    const braceStart = jsonStr.indexOf('{');
    const braceEnd = jsonStr.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd !== -1) {
      jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
    }
  }

  console.log('Parsing AI response, first 500 chars:', jsonStr.substring(0, 500));

  // Try to fix common JSON issues from LLMs
  // Remove trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    console.error('JSON parse error:', e.message);
    console.error('Full JSON string:', jsonStr.substring(0, 2000));
    // Try more aggressive cleanup: remove control characters
    jsonStr = jsonStr.replace(/[\x00-\x1f\x7f]/g, (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
      return '';
    });
    parsed = JSON.parse(jsonStr);
  }

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
  return !!process.env.GEMINI_API_KEY;
}
