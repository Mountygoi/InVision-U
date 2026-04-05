import type { AIScores, ScoringWeights } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';
import {
  IELTS_MIN_CRITICAL, IELTS_TARGET,
  UNT_MIN_CRITICAL, UNT_TARGET,
  IELTS_CRITICAL_PENALTY, IELTS_BELOW_TARGET_PENALTY,
  UNT_CRITICAL_PENALTY, UNT_BELOW_TARGET_PENALTY,
} from './constants.js';

export function calculateCompositeScore(
  aiScores: AIScores | null,
  achievementScore: number,
  _isRural: boolean,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  ielts: number | null = null,
  unt: number | null = null
): number {
  let baseScore = 0;

  // Weighted AI dimension score + achievement bonus
  if (!aiScores) {
    const base = (achievementScore / 50) * 30; 
    baseScore = base;
  } else {
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

    baseScore = weightedAI * 0.75 + achievementBonus;
  }

  // Apply academic threshold penalties
  let finalScore = baseScore;

  // IELTS penalty (target: 6.5+)
  if (ielts !== null) {
    if (ielts < IELTS_MIN_CRITICAL) {
      finalScore -= IELTS_CRITICAL_PENALTY;
    } else if (ielts < IELTS_TARGET) {
      finalScore -= IELTS_BELOW_TARGET_PENALTY;
    }
  }

  // UNT penalty (target: 85+)
  if (unt !== null) {
    if (unt < UNT_MIN_CRITICAL) {
      finalScore -= UNT_CRITICAL_PENALTY;
    } else if (unt < UNT_TARGET) {
      finalScore -= UNT_BELOW_TARGET_PENALTY;
    }
  }

  // Clamp to 0-100 and round to 1 decimal place
  return Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10;
}