import { getGroqClient, GROQ_MODEL } from './constants.js';

export type ClusterId =
  | 'leadershipInitiative'
  | 'responsibility'
  | 'growthMindset'
  | 'ambition'
  | 'ethics'
  | 'communityOrientation'
  | 'collaboration'
  | 'criticalThinking';

export interface PersonalityClusterScores {
  leadershipInitiative: number;
  responsibility: number;
  growthMindset: number;
  ambition: number;
  ethics: number;
  communityOrientation: number;
  collaboration: number;
  criticalThinking: number;
}

export interface PersonalityResult {
  clusterScores: PersonalityClusterScores;
  overallScore: number;
  narrative: string;
}

export interface PersonalityAnswer {
  questionId: number;
  clusterId: ClusterId;
  value: number; // 1–5
}

const CLUSTER_LABELS: Record<ClusterId, string> = {
  leadershipInitiative: 'Leadership Initiative',
  responsibility: 'Responsibility',
  growthMindset: 'Growth Mindset',
  ambition: 'Ambition',
  ethics: 'Ethics',
  communityOrientation: 'Community Orientation',
  collaboration: 'Collaboration',
  criticalThinking: 'Critical Thinking',
};

/**
 * Deterministic: normalize raw Likert sum (n questions × 1–5) to 0–100.
 */
function normalizeClusterScore(rawAnswers: number[]): number {
  if (rawAnswers.length === 0) return 0;
  const sum = rawAnswers.reduce((a, b) => a + b, 0);
  const min = rawAnswers.length;       // all 1s
  const max = rawAnswers.length * 5;   // all 5s
  return Math.round(((sum - min) / (max - min)) * 100);
}

export async function analyzePersonality(
  answers: PersonalityAnswer[]
): Promise<PersonalityResult> {
  // Group answers by cluster
  const clusterAnswers: Record<string, number[]> = {
    leadershipInitiative: [],
    responsibility: [],
    growthMindset: [],
    ambition: [],
    ethics: [],
    communityOrientation: [],
    collaboration: [],
    criticalThinking: [],
  };

  for (const a of answers) {
    if (clusterAnswers[a.clusterId] !== undefined) {
      clusterAnswers[a.clusterId].push(a.value);
    }
  }

  // Score each cluster deterministically
  const clusterScores: PersonalityClusterScores = {
    leadershipInitiative: normalizeClusterScore(clusterAnswers.leadershipInitiative),
    responsibility: normalizeClusterScore(clusterAnswers.responsibility),
    growthMindset: normalizeClusterScore(clusterAnswers.growthMindset),
    ambition: normalizeClusterScore(clusterAnswers.ambition),
    ethics: normalizeClusterScore(clusterAnswers.ethics),
    communityOrientation: normalizeClusterScore(clusterAnswers.communityOrientation),
    collaboration: normalizeClusterScore(clusterAnswers.collaboration),
    criticalThinking: normalizeClusterScore(clusterAnswers.criticalThinking),
  };

  const values = Object.values(clusterScores);
  const overallScore = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // Groq narrative (falls back to deterministic if API fails)
  let narrative = '';
  try {
    const scoreLines = (Object.entries(clusterScores) as [ClusterId, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${CLUSTER_LABELS[k]}: ${v}/100`)
      .join('\n');

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{
        role: 'user',
        content: `You are an admissions psychologist for InVision U, a scholarship university in Kazakhstan.
A candidate completed a 40-question personality assessment across 8 clusters.

Scores (ranked highest to lowest):
${scoreLines}

Write a 3–4 sentence personality narrative for the admissions committee.
- Name the 2 highest-scoring clusters and what they suggest about the candidate
- Note 1 area for development (lowest cluster)
- Close with a concise leadership potential assessment
Be objective, specific, and avoid generic praise. Write in English.`,
      }],
      max_tokens: 240,
      temperature: 0.3,
    });

    narrative = completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('Groq personality narrative error:', err);
  }

  // Deterministic fallback
  if (!narrative) {
    const sorted = (Object.entries(clusterScores) as [ClusterId, number][]).sort(
      (a, b) => b[1] - a[1]
    );
    const top1 = CLUSTER_LABELS[sorted[0][0]];
    const top2 = CLUSTER_LABELS[sorted[1][0]];
    const bottom = CLUSTER_LABELS[sorted[sorted.length - 1][0]];
    narrative = `The candidate demonstrates strong ${top1} (${sorted[0][1]}/100) and ${top2} (${sorted[1][1]}/100), indicating solid potential for leadership-oriented roles. The area most likely to benefit from further development is ${bottom} (${sorted[sorted.length - 1][1]}/100). Overall personality score: ${overallScore}/100.`;
  }

  return { clusterScores, overallScore, narrative };
}
