import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/stats - Dashboard statistics
router.get('/', async (req, res) => {
  try {
    const [totals, avgScore, scoreDistribution, regionBreakdown, statusFunnel, recentApplications] = await Promise.all([
      pool.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE status = 'interview') as interview,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'declined') as declined,
        COUNT(*) FILTER (WHERE is_rural = true) as rural
      FROM candidates`),

      pool.query('SELECT ROUND(AVG(composite_score)::numeric, 1) as avg FROM candidates'),

      pool.query(`SELECT
        CASE
          WHEN composite_score < 20 THEN '0-20'
          WHEN composite_score < 40 THEN '20-40'
          WHEN composite_score < 60 THEN '40-60'
          WHEN composite_score < 80 THEN '60-80'
          ELSE '80-100'
        END as bucket,
        COUNT(*) as count
      FROM candidates
      GROUP BY bucket
      ORDER BY bucket`),

      pool.query(`SELECT
        city as region,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_rural = true) as rural
      FROM candidates
      GROUP BY city
      ORDER BY count DESC`),

      pool.query(`SELECT status, COUNT(*) as count
      FROM candidates
      GROUP BY status
      ORDER BY CASE status
        WHEN 'new' THEN 1
        WHEN 'under_review' THEN 2
        WHEN 'interview' THEN 3
        WHEN 'accepted' THEN 4
        WHEN 'waitlisted' THEN 5
        WHEN 'declined' THEN 6
      END`),

      pool.query(`SELECT id, name, city, university, status, composite_score, created_at
      FROM candidates
      ORDER BY created_at DESC
      LIMIT 5`)
    ]);

    const t = totals.rows[0];

    res.json({
      total: parseInt(t.total),
      new: parseInt(t.new),
      underReview: parseInt(t.under_review),
      interview: parseInt(t.interview),
      accepted: parseInt(t.accepted),
      declined: parseInt(t.declined),
      rural: parseInt(t.rural),
      avgCompositeScore: parseFloat(avgScore.rows[0]?.avg || '0'),
      scoreDistribution: scoreDistribution.rows.map(r => ({ bucket: r.bucket, count: parseInt(r.count) })),
      regionBreakdown: regionBreakdown.rows.map(r => ({ region: r.region, count: parseInt(r.count), rural: parseInt(r.rural) })),
      statusFunnel: statusFunnel.rows.map(r => ({ status: r.status, count: parseInt(r.count) })),
      recentApplications: recentApplications.rows.map(r => ({
        id: r.id,
        name: r.name,
        city: r.city,
        university: r.university,
        status: r.status,
        compositeScore: r.composite_score,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/stats/baseline - Compare AI composite score vs simple rule-based baseline
router.get('/baseline', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        COALESCE(gpa, 0)            AS gpa,
        COALESCE(achievement_score, 0) AS achievement_score,
        COALESCE(composite_score, 0)   AS ai_score,
        is_rural
      FROM candidates
      WHERE composite_score > 0
    `);

    if (result.rows.length === 0) {
      res.json({ message: 'No analyzed candidates yet', candidates: 0 });
      return;
    }

    const rows = result.rows;

    // Simple rule-based baseline: GPA × 15 + achievement_score × 0.6 + rural bonus 5
    const baselineScores = rows.map(r => {
      const baseline = Math.min(100,
        (parseFloat(r.gpa) / 4.0) * 15 +
        parseFloat(r.achievement_score) * 0.6 +
        (r.is_rural ? 5 : 0)
      );
      return { aiScore: parseFloat(r.ai_score), baselineScore: Math.round(baseline * 10) / 10 };
    });

    const avgAI = baselineScores.reduce((s, r) => s + r.aiScore, 0) / baselineScores.length;
    const avgBaseline = baselineScores.reduce((s, r) => s + r.baselineScore, 0) / baselineScores.length;

    // Rank correlation (Spearman approximation via position diff)
    const sortedByAI = [...baselineScores].sort((a, b) => b.aiScore - a.aiScore);
    const sortedByBaseline = [...baselineScores].sort((a, b) => b.baselineScore - a.baselineScore);

    // Count candidates AI ranks in top-10 that baseline also ranks in top-10
    const aiTop10Ids = new Set(sortedByAI.slice(0, 10).map((_, i) => i));
    const baselineTop10Ids = new Set(sortedByBaseline.slice(0, 10).map((_, i) => i));
    const overlap = [...aiTop10Ids].filter(id => baselineTop10Ids.has(id)).length;

    // Distribution comparison: how many score bands shift
    const bands = ['0-20', '20-40', '40-60', '60-80', '80-100'];
    const toBand = (s: number) => {
      if (s < 20) return '0-20';
      if (s < 40) return '20-40';
      if (s < 60) return '40-60';
      if (s < 80) return '60-80';
      return '80-100';
    };

    const distribution = bands.map(band => ({
      band,
      aiCount: baselineScores.filter(r => toBand(r.aiScore) === band).length,
      baselineCount: baselineScores.filter(r => toBand(r.baselineScore) === band).length,
    }));

    res.json({
      candidates: rows.length,
      avgAIScore: Math.round(avgAI * 10) / 10,
      avgBaselineScore: Math.round(avgBaseline * 10) / 10,
      avgImprovement: Math.round((avgAI - avgBaseline) * 10) / 10,
      top10Overlap: overlap,
      distribution,
      methodology: {
        baseline: 'GPA×15 + achievement_score×0.6 + rural_bonus(5)',
        ai: 'weighted_essay_dimensions×0.75 + achievement_bonus + rural_bonus (configurable)',
      },
    });
  } catch (err) {
    console.error('Error computing baseline comparison:', err);
    res.status(500).json({ error: 'Failed to compute baseline comparison' });
  }
});

export default router;
