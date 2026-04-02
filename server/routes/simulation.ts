import { Router } from 'express';
import { generateAgentResponse, analyzeLeadership } from '../ai/simulationAnalyzer.js';
import type { SimulationMessage } from '../ai/simulationAnalyzer.js';
import pool from '../db.js';

const router = Router();

// POST /api/simulation/message
// Body: { history: SimulationMessage[], candidateMessage: string, turnIndex: number }
router.post('/message', async (req, res) => {
  try {
    const { history, candidateMessage, turnIndex, candidateName } = req.body as {
      history: SimulationMessage[];
      candidateMessage: string;
      turnIndex: number;
      candidateName?: string;
    };

    if (!candidateMessage || typeof candidateMessage !== 'string' || !candidateMessage.trim()) {
      res.status(400).json({ error: 'candidateMessage is required' });
      return;
    }

    if (typeof turnIndex !== 'number' || turnIndex < 0) {
      res.status(400).json({ error: 'turnIndex must be a non-negative number' });
      return;
    }

    const response = await generateAgentResponse(
      Array.isArray(history) ? history : [],
      candidateMessage.trim(),
      turnIndex,
      candidateName
    );

    res.json(response);
  } catch (err: any) {
    console.error('Simulation message error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate agent response' });
  }
});

// POST /api/simulation/finish
// Body: { history: SimulationMessage[], candidateId?: string }
router.post('/finish', async (req, res) => {
  try {
    const { history, candidateId } = req.body as {
      history: SimulationMessage[];
      candidateId?: string;
    };

    if (!Array.isArray(history) || history.length === 0) {
      res.status(400).json({ error: 'history is required and must be non-empty' });
      return;
    }

    const candidateMessages = history.filter(m => m.role === 'candidate');
    if (candidateMessages.length < 5) {
      res.status(400).json({ error: 'At least 5 candidate messages are required to finish' });
      return;
    }

    const scores = await analyzeLeadership(history);

    // Persist to DB if candidateId provided (non-fatal if DB fails)
    if (candidateId) {
      try {
        await pool.query(
          `UPDATE candidates SET simulation_scores = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(scores), candidateId]
        );
      } catch (dbErr) {
        console.error('DB update error (simulation_scores):', dbErr);
      }
    }

    res.json({ candidateId: candidateId || null, ...scores });
  } catch (err: any) {
    console.error('Simulation finish error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze leadership' });
  }
});

export default router;
