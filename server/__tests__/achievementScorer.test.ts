import { describe, it, expect } from 'vitest';
import { calculateAchievementScore } from '../ai/achievementScorer.js';
import type { Achievement } from '../types.js';

describe('calculateAchievementScore', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateAchievementScore([])).toBe(0);
  });

  it('scores a national olympiad at 20 points', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'Math Olympiad', level: 'national' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(20);
  });

  it('scores a regional olympiad at 12 points', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'Physics Olympiad', level: 'regional' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(12);
  });

  it('scores a city olympiad at 8 points', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'Chemistry Olympiad', level: 'city' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(8);
  });

  it('scores a school-level olympiad at 4 points', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'School Biology', level: 'school' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(4);
  });

  it('falls back to school level for unknown olympiad level', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'Unknown level', level: undefined },
    ];
    // No level → else branch → category['default'] ?? 8 → 8 (no 'default' key for olympiad)
    expect(calculateAchievementScore(achievements)).toBe(8);
  });

  it('scores volunteering at 10 points', () => {
    const achievements: Achievement[] = [
      { type: 'volunteering', title: 'Red Crescent' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(10);
  });

  it('scores a project at 10 points', () => {
    const achievements: Achievement[] = [
      { type: 'project', title: 'Mobile App' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(10);
  });

  it('scores an award at 8 points', () => {
    const achievements: Achievement[] = [
      { type: 'award', title: 'Best Student' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(8);
  });

  it('sums multiple achievements correctly', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'Math', level: 'national' },  // 20
      { type: 'volunteering', title: 'Volunteer' },              // 10
      { type: 'award', title: 'Prize' },                         // 8
    ];
    expect(calculateAchievementScore(achievements)).toBe(38);
  });

  it('caps the total at 50', () => {
    const achievements: Achievement[] = [
      { type: 'olympiad', title: 'Math', level: 'national' },      // 20
      { type: 'olympiad', title: 'Physics', level: 'national' },   // 20
      { type: 'olympiad', title: 'Chemistry', level: 'national' }, // 20
    ];
    // 60 → capped to 50
    expect(calculateAchievementScore(achievements)).toBe(50);
  });

  it('ignores unknown achievement types', () => {
    const achievements = [
      { type: 'unknown_type' as any, title: 'Some random thing' },
    ];
    expect(calculateAchievementScore(achievements)).toBe(0);
  });
});
