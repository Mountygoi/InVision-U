import type { Candidate, ScoringWeights } from '../types';
export const calculateCandidateScore = (candidate: Candidate, weights: ScoringWeights): number => {
  let totalPoints = 0;

  if (candidate.experience.includes('volunteering')) totalPoints += weights.volunteering;
  if (candidate.experience.includes('olympiad')) totalPoints += weights.olympiad;
  if (candidate.experience.includes('project')) totalPoints += weights.project;
  if (candidate.isRural) totalPoints += weights.ruralBonus;

  // Масштабируем до 10-балльной шкалы (предположим, макс. сумма около 100)
  const score = totalPoints / 10;
  return Math.min(10, score);
};