import type { AIScores, ScoringWeights } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';

export function calculateCompositeScore(
  aiScores: AIScores | null,
  achievementScore: number,
  isRural: boolean,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  if (!aiScores) {
    const base = (achievementScore / 50) * 30; 
    const rural = isRural ? weights.ruralBonus : 0;
    return Math.round((base + rural) * 10) / 10;
  }

  const dimensionWeightSum =
    weights.motivation +
    weights.leadership +
    weights.technicalPotential +
    weights.creativity +
    weights.resilience +
    weights.socialImpact;

  const weightedAI =
    (aiScores.motivation.score * weights.motivation +
      aiScores.leadership.score * weights.leadership +
      aiScores.technicalPotential.score * weights.technicalPotential +
      aiScores.creativity.score * weights.creativity +
      aiScores.resilience.score * weights.resilience +
      aiScores.socialImpact.score * weights.socialImpact) /
    dimensionWeightSum;

  const achievementBonus = (achievementScore / 50) * weights.achievementBonus;

  const ruralBonus = isRural ? weights.ruralBonus : 0;

  const finalScore = weightedAI * 0.75 + achievementBonus + ruralBonus;

  return Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10;
}
