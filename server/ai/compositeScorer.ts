import type { AIScores, ScoringWeights } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';

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
    const rural = isRural ? weights.ruralBonus : 0;
    baseScore = base + rural;
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
    const ruralBonus = isRural ? weights.ruralBonus : 0;

    baseScore = weightedAI * 0.75 + achievementBonus + ruralBonus;
  }

  // 2. Логика "Conservative Scoring" (Штрафы за несоответствие критериям)
  let finalScore = baseScore;

  // Критерии IELTS (Целевой 6.5+)
  if (ielts !== null) {
    if (ielts < 5.5) {
      finalScore -= 30; // Жесткий штраф за критически низкий уровень
    } else if (ielts < 6.5) {
      finalScore -= 10; // Небольшой штраф за недобор до целевого балла
    }
  }

  // Критерии ЕНТ (UNT) (Целевой 80+)
  if (unt !== null) {
    if (unt < 75) {
      finalScore -= 40; // Очень жесткий штраф: школа не хочет пропускать "слабых"
    } else if (unt < 85) {
      finalScore -= 15; // Штраф за пограничный результат
    }
  }

  // Возвращаем результат в диапазоне 0-100 с округлением до 1 знака
  return Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10;
}