import { Router } from 'express';
import { analyzeSJT } from '../ai/sjtAnalyzer.js';
import type { SJTAnswer } from '../ai/sjtAnalyzer.js';
import pool from '../db.js';
import { analyzeEssay, isAIAvailable } from '../ai/essayAnalyzer.js';
import { calculateCompositeScore } from '../ai/compositeScorer.js';
import type { ScoringWeights, Achievement } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';

const router = Router();

async function getWeights(): Promise<ScoringWeights> {
  const result = await pool.query('SELECT weights FROM scoring_config WHERE id = 1');
  return result.rows[0]?.weights ?? DEFAULT_WEIGHTS;
}

// POST /api/sjt/analyze - Analyze SJT + trigger full AI scoring
router.post('/analyze', async (req, res) => {
  try {
    const { candidateId, answers } = req.body as {
      candidateId?: string;
      answers: SJTAnswer[];
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: 'answers array is required' });
      return;
    }

    for (const answer of answers) {
      if (!answer.scenarioId || !answer.chosenOption) {
        res.status(400).json({ error: 'Each answer must have scenarioId and chosenOption' });
        return;
      }
    }

    console.log(`SJT analysis requested for candidate: ${candidateId || 'anonymous'}, ${answers.length} scenarios`);

    // 1. Analyze SJT with AI
    const sjtResult = await analyzeSJT(answers);

    // 2. Save SJT results to candidate DB if candidateId provided
    if (candidateId) {
      await pool.query(
        `UPDATE candidates SET
          sjt_answers = $1,
          sjt_scores = $2,
          sjt_summary = $3,
          updated_at = NOW()
        WHERE id = $4`,
        [
          JSON.stringify(answers),
          JSON.stringify(sjtResult.overallScores),
          sjtResult.personalitySummary,
          candidateId,
        ]
      );

      // 3. Trigger full AI essay analysis
      if (isAIAvailable()) {
        const candidate = await pool.query(
          'SELECT essay_text, name, achievements, university, city, achievement_score, is_rural FROM candidates WHERE id = $1',
          [candidateId]
        );

        if (candidate.rows.length > 0) {
          const c = candidate.rows[0];

          if (c.essay_text) {
            try {
              console.log(`Triggering full AI analysis for candidate ${candidateId}...`);
              const analysis = await analyzeEssay(
                c.essay_text,
                c.name,
                c.achievements || [],
                c.university || '',
                c.city
              );

              const weights = await getWeights();
              const compositeScore = calculateCompositeScore(
                analysis.scores,
                c.achievement_score,
                c.is_rural,
                weights
              );

              await pool.query(
                `UPDATE candidates SET
                  ai_scores = $1, ai_summary = $2, ai_flags = $3,
                  ai_model_version = $4, ai_analyzed_at = $5,
                  composite_score = $6, status = 'under_review',
                  updated_at = NOW()
                WHERE id = $7`,
                [
                  JSON.stringify(analysis.scores),
                  analysis.summary,
                  JSON.stringify(analysis.flags),
                  analysis.modelVersion,
                  analysis.analyzedAt,
                  compositeScore,
                  candidateId,
                ]
              );

              console.log(`Full AI analysis complete for ${candidateId}, composite: ${compositeScore}`);
            } catch (aiErr: any) {
              console.error('Essay AI analysis failed (SJT saved anyway):', aiErr?.message);
            }
          }
        }
      }

      await pool.query(
        'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
        [candidateId, 'sjt_completed', `Scores: L${sjtResult.overallScores.leadership} PS${sjtResult.overallScores.problemSolving}`]
      );
    }

    res.json({
      candidateId: candidateId || null,
      ...sjtResult,
    });
  } catch (err: any) {
    console.error('SJT analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze SJT responses' });
  }
});

export default router;
