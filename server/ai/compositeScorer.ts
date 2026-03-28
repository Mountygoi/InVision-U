import type { AIScores, ScoringWeights } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';

export function calculateCompositeScore(
  aiScores: AIScores | null,
  achievementScore: number,
  isRural: boolean,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  if (!aiScores) {
    // No AI analysis yet - use achievement + rural only
    const base = (achievementScore / 50) * 30; // normalize to max ~30
    const rural = isRural ? weights.ruralBonus : 0;
    return Math.round((base + rural) * 10) / 10;
  }

  // Sum of dimension weights (for normalization)
  const dimensionWeightSum =
    weights.motivation +
    weights.leadership +
    weights.technicalPotential +
    weights.creativity +
    weights.resilience +
    weights.socialImpact;

  // Weighted AI score (normalized to 0-100)
  const weightedAI =
    (aiScores.motivation.score * weights.motivation +
      aiScores.leadership.score * weights.leadership +
      aiScores.technicalPotential.score * weights.technicalPotential +
      aiScores.creativity.score * weights.creativity +
      aiScores.resilience.score * weights.resilience +
      aiScores.socialImpact.score * weights.socialImpact) /
    dimensionWeightSum;

  // Achievement bonus (normalized to 0-15 range)
  const achievementBonus = (achievementScore / 50) * weights.achievementBonus;

  // Rural bonus
  const ruralBonus = isRural ? weights.ruralBonus : 0;

  // Final score: AI base (0-100) scaled to 75% + bonuses
  const finalScore = weightedAI * 0.75 + achievementBonus + ruralBonus;

  // Clamp to 0-100
  return Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10;
}
