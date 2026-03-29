import type { Achievement } from '../types.js';

const SCORES: Record<string, Record<string, number>> = {
  olympiad: { national: 20, regional: 12, city: 8, school: 4 },
  volunteering: { default: 10 },
  project: { default: 10 },
  award: { default: 8 },
};

export function calculateAchievementScore(achievements: Achievement[]): number {
  let total = 0;

  for (const a of achievements) {
    const category = SCORES[a.type];
    if (!category) continue;

    if (a.type === 'olympiad' && a.level) {
      total += category[a.level] ?? category['school'] ?? 4;
    } else {
      total += category['default'] ?? 8;
    }
  }

  return Math.min(total, 50);
}
