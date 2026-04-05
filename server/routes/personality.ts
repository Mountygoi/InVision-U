import { Router } from 'express';
import { analyzePersonality } from '../ai/personalityAnalyzer.js';
import type { PersonalityAnswer } from '../ai/personalityAnalyzer.js';
import pool from '../db.js';

const router = Router();

// POST /api/personality/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { candidateId, answers } = req.body as {
      candidateId?: string;
      answers: PersonalityAnswer[];
    };

    if (!answers || !Array.isArray(answers) || answers.length !== 40) {
      res.status(400).json({ error: 'Exactly 40 answers are required' });
      return;
    }

    for (const a of answers) {
      if (!a.clusterId || typeof a.value !== 'number' || a.value < 1 || a.value > 5) {
        res.status(400).json({
          error: 'Each answer must have a valid clusterId and a value between 1 and 5',
        });
        return;
      }
    }

    const result = await analyzePersonality(answers);

    // Persist to DB if candidateId provided (non-fatal if DB fails)
    if (candidateId) {
      try {
        await pool.query(
          `UPDATE candidates SET personality_scores = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(result), candidateId]
        );
      } catch (dbErr) {
        console.error('DB update error (personality_scores):', dbErr);
      }
    }

    res.json({ candidateId: candidateId || null, ...result });
  } catch (err: any) {
    console.error('Personality analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze personality responses' });
  }
});

export default router;
