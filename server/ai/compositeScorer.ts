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
  isRural: boolean,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  ielts: number | null = null, // Новое поле
  unt: number | null = null    // Новое поле
): number {
  let baseScore = 0;

  // 1. Расчет базовой части (как и было)
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

  // 2. Логика "Conservative Scoring" (Штрафы за несоответствие критериям)
  let finalScore = baseScore;

  // Критерии IELTS (Целевой 6.5+)
  if (ielts !== null) {
    if (ielts < IELTS_MIN_CRITICAL) {
      finalScore -= IELTS_CRITICAL_PENALTY;
    } else if (ielts < IELTS_TARGET) {
      finalScore -= IELTS_BELOW_TARGET_PENALTY;
    }
  }

  // Критерии ЕНТ (UNT) (Целевой 80+)
  if (unt !== null) {
    if (unt < UNT_MIN_CRITICAL) {
      finalScore -= UNT_CRITICAL_PENALTY;
    } else if (unt < UNT_TARGET) {
      finalScore -= UNT_BELOW_TARGET_PENALTY;
    }
  }

  // Возвращаем результат в диапазоне 0-100 с округлением до 1 знака
  return Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10;
}