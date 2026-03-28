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

export default router;
