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
      generationConfig: { temperature: 0.3, maxOutputTokens: 3000, responseMimeType: 'application/json' },
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
          const parts = parsed.candidates?.[0]?.content?.parts || [];
          // Gemini 2.5 thinking models return multiple parts - find the text part (not thought)
          let text = '';
          for (const part of parts) {
            if (part.text && !part.thought) {
              text = part.text;
              break;
            }
          }
          if (!text && parts.length > 0) {
            text = parts[parts.length - 1].text || '';
          }
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

  // Extract JSON from response
  let jsonStr = responseText.trim();

  // Strategy: find the outermost { ... } in the response
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    console.error('JSON parse error:', e.message);
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      console.error('Context around error:', jsonStr.substring(Math.max(0, pos - 100), pos + 100));
    }
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\n/g, '\\n');
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw e;
    }
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
