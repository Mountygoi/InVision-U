import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import candidatesRouter from './routes/candidates.js';
import statsRouter from './routes/stats.js';
import configRouter from './routes/config.js';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually to ensure it works with all Node/tsx versions
try {
  const envPath = path.resolve(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const parsed = dotenv.parse(envContent);
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch { /* .env file not found, using system env vars */ }
console.log('ANTHROPIC_API_KEY loaded:', !!process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/candidates', candidatesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/scoring-config', configRouter);

// Apply route is on candidatesRouter but mapped to /api/apply for backward compat
app.post('/api/apply', (req, res, next) => {
  req.url = '/apply';
  candidatesRouter(req, res, next);
});

// Audit log
app.get('/api/audit-log', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, c.name as candidate_name
       FROM audit_log al
       LEFT JOIN candidates c ON al.candidate_id = c.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      candidateId: r.candidate_id,
      candidateName: r.candidate_name,
      action: r.action,
      oldValue: r.old_value,
      newValue: r.new_value,
      performedBy: r.performed_by,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('Error fetching audit log:', err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', aiAvailable: !!process.env.GEMINI_API_KEY });
});

const PORT = parseInt(process.env.PORT || '5000');

async function start() {
  try {
    await initDatabase();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`
  InVision U API Server
  =====================
  API Base:        http://localhost:${PORT}/api
  Candidates:      http://localhost:${PORT}/api/candidates
  Stats:           http://localhost:${PORT}/api/stats
  Scoring Config:  http://localhost:${PORT}/api/scoring-config
  Health:          http://localhost:${PORT}/api/health
  AI Available:    ${!!process.env.GEMINI_API_KEY ? 'Yes' : 'No (set ANTHROPIC_API_KEY in .env)'}
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
