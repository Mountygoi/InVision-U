import { Router } from 'express';
import { analyzeSJT } from '../ai/sjtAnalyzer.js';
import type { SJTAnswer } from '../ai/sjtAnalyzer.js';

const router = Router();

// POST /api/sjt/analyze
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

    // Validate each answer
    for (const answer of answers) {
      if (!answer.scenarioId || !answer.chosenOption) {
        res.status(400).json({ error: 'Each answer must have scenarioId and chosenOption' });
        return;
      }
    }

    console.log(`SJT analysis requested for candidate: ${candidateId || 'anonymous'}, ${answers.length} scenarios`);

    const result = await analyzeSJT(answers);

    res.json({
      candidateId: candidateId || null,
      ...result,
    });
  } catch (err: any) {
    console.error('SJT analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze SJT responses' });
  }
});

export default router;
