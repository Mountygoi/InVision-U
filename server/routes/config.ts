import { Router } from 'express';
import pool from '../db.js';
import { DEFAULT_WEIGHTS } from '../types.js';
import { calculateCompositeScore } from '../ai/compositeScorer.js';
import type { ScoringWeights } from '../types.js';

const router = Router();

// GET /api/scoring-config
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT weights, updated_at FROM scoring_config WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ weights: DEFAULT_WEIGHTS, updatedAt: null });
    }
    res.json({ weights: result.rows[0].weights, updatedAt: result.rows[0].updated_at });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ error: 'Failed to fetch scoring config' });
  }
});

// PUT /api/scoring-config - Update weights and recalculate all scores
router.put('/', async (req, res) => {
  try {
    const { weights } = req.body as { weights: ScoringWeights };

    if (!weights) {
      return res.status(400).json({ error: 'Weights are required' });
    }

    // Save new weights
    await pool.query(
      'INSERT INTO scoring_config (id, weights, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET weights = $1, updated_at = NOW()',
      [JSON.stringify(weights)]
    );

    // Recalculate all composite scores
    const candidates = await pool.query('SELECT id, ai_scores, achievement_score, is_rural FROM candidates');
    for (const c of candidates.rows) {
      const newScore = calculateCompositeScore(c.ai_scores, c.achievement_score, c.is_rural, weights);
      await pool.query('UPDATE candidates SET composite_score = $1, updated_at = NOW() WHERE id = $2', [newScore, c.id]);
    }

    res.json({ message: 'Scoring config updated and scores recalculated', count: candidates.rows.length });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ error: 'Failed to update scoring config' });
  }
});

export default router;
