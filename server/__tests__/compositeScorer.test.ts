import { describe, it, expect } from 'vitest';
import { calculateCompositeScore } from '../ai/compositeScorer.js';
import type { AIScores, ScoringWeights } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';

const makeScores = (base: number): AIScores => ({
  motivation:          { score: base, evidence: 'test' },
  leadership:          { score: base, evidence: 'test' },
  technicalPotential:  { score: base, evidence: 'test' },
  creativity:          { score: base, evidence: 'test' },
  resilience:          { score: base, evidence: 'test' },
  socialImpact:        { score: base, evidence: 'test' },
});

describe('calculateCompositeScore', () => {
  it('returns achievement-only score when aiScores is null', () => {
    // achievementScore=30, formula: (30/50)*30 = 18
    const score = calculateCompositeScore(null, 30, false);
    expect(score).toBeCloseTo(18, 1);
  });

  it('returns 0 for zero achievement and no AI', () => {
    expect(calculateCompositeScore(null, 0, false)).toBe(0);
  });

  it('calculates weighted AI score with achievements', () => {
    const scores = makeScores(80);
    const result = calculateCompositeScore(scores, 25, false, DEFAULT_WEIGHTS);
    // Weighted AI = 80 (all equal), base = 80*0.75 + (25/50)*15 = 60 + 7.5 = 67.5
    expect(result).toBeCloseTo(67.5, 1);
  });

  it('never exceeds 100', () => {
    const scores = makeScores(100);
    const result = calculateCompositeScore(scores, 50, false);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('never goes below 0', () => {
    // Low scores + heavy penalties
    const scores = makeScores(10);
    const result = calculateCompositeScore(scores, 0, false, DEFAULT_WEIGHTS, 3.0, 50);
    // IELTS < 5.5 → -30, UNT < 75 → -40
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('applies IELTS critical penalty when below 5.5', () => {
    const withoutIelts = calculateCompositeScore(null, 30, false);
    const withLowIelts = calculateCompositeScore(null, 30, false, DEFAULT_WEIGHTS, 4.0);
    // Critical penalty = -30
    expect(withLowIelts).toBe(Math.max(0, withoutIelts - 30));
  });

  it('applies IELTS below-target penalty when between 5.5 and 6.5', () => {
    const withoutIelts = calculateCompositeScore(null, 30, false);
    const withMedIelts = calculateCompositeScore(null, 30, false, DEFAULT_WEIGHTS, 6.0);
    // Below-target penalty = -10
    expect(withMedIelts).toBeCloseTo(withoutIelts - 10, 1);
  });

  it('applies no IELTS penalty when at or above target', () => {
    const base = calculateCompositeScore(null, 30, false);
    const withGood = calculateCompositeScore(null, 30, false, DEFAULT_WEIGHTS, 7.0);
    expect(withGood).toBeCloseTo(base, 1);
  });

  it('applies UNT critical penalty when below 75', () => {
    const withLow = calculateCompositeScore(null, 30, false, DEFAULT_WEIGHTS, null, 60);
    // Critical penalty = -40
    expect(withLow).toBe(0); // 18 - 40 = -22 → capped at 0
  });

  it('applies UNT below-target penalty when between 75 and 85', () => {
    const without = calculateCompositeScore(null, 30, false);
    const withMed = calculateCompositeScore(null, 30, false, DEFAULT_WEIGHTS, null, 80);
    // Below-target penalty = -15
    expect(withMed).toBeCloseTo(without - 15, 1);
  });

  it('applies no UNT penalty at or above target', () => {
    const without = calculateCompositeScore(null, 30, false);
    const withGood = calculateCompositeScore(null, 30, false, DEFAULT_WEIGHTS, null, 90);
    expect(withGood).toBeCloseTo(without, 1);
  });

  it('respects custom weights', () => {
    const customWeights: ScoringWeights = {
      motivation: 50,
      leadership: 0,
      technicalPotential: 0,
      creativity: 0,
      resilience: 0,
      socialImpact: 0,
      achievementBonus: 0,
    };
    const scores = makeScores(80);
    // Only motivation matters: 80 * 0.75 = 60
    const result = calculateCompositeScore(scores, 0, false, customWeights);
    expect(result).toBeCloseTo(60, 1);
  });

  it('rounds to 1 decimal place', () => {
    const result = calculateCompositeScore(null, 15, false);
    const decimals = result.toString().split('.')[1];
    expect(!decimals || decimals.length <= 1).toBe(true);
  });
});
