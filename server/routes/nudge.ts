  import { Router } from 'express';
  import { analyzeForNudge } from '../ai/nudgeAnalyzer.js';

  const router = Router();

  // POST /api/nudge - Get AI feedback on application draft
  router.post('/', async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(503).json({ error: 'AI is not available' });
      }

      const { essayText, achievements, skills, name, city } = req.body;

      // Need at least something to analyze
      const hasContent = essayText?.trim() ||
        (achievements && achievements.length > 0) ||
        (skills && skills.length > 0);

      if (!hasContent) {
        return res.status(400).json({
          error: 'Please add some content first — essay, achievements, or skills — so the AI can give feedback.'
        });
      }

      const result = await analyzeForNudge({ essayText, achievements, skills, name, city });
      res.json(result);
    } catch (err: any) {
      console.error('Nudge analysis error:', err?.message || err);
      res.status(500).json({ error: 'Failed to analyze draft', details: err?.message });
    }
  });

  export default router;
