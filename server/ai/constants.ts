import Groq from 'groq-sdk';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

/**
 * Extract and parse JSON from an AI response string that may contain
 * markdown wrappers, trailing commas, or other artifacts.
 */
export function parseAIJson<T = unknown>(responseText: string): T {
  let jsonStr = responseText.trim();

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e: unknown) {
    // Attempt to fix unescaped newlines inside JSON string values
    jsonStr = jsonStr.replace(/(?<=:\s*"[^"]*)\n/g, '\\n');
    return JSON.parse(jsonStr) as T;
  }
}

// Scoring thresholds
export const IELTS_MIN_CRITICAL = 5.5;
export const IELTS_TARGET = 6.5;
export const UNT_MIN_CRITICAL = 75;
export const UNT_TARGET = 85;

export const IELTS_CRITICAL_PENALTY = 30;
export const IELTS_BELOW_TARGET_PENALTY = 10;
export const UNT_CRITICAL_PENALTY = 40;
export const UNT_BELOW_TARGET_PENALTY = 15;

// Upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];

// Rural cities (Kazakhstan)
export const RURAL_CITIES = [
  'Qyzylorda', 'Atyrau', 'Aktau', 'Turkistan',
  'Taraz', 'Oral', 'Kostanay', 'Petropavl',
];
