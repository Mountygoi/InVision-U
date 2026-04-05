import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import candidatesRouter from './routes/candidates.js';
import personalityRouter from './routes/personality.js';
import statsRouter from './routes/stats.js';
import configRouter from './routes/config.js';
import sjtRouter from './routes/sjt.js';
import nudgeRouter from './routes/nudge.js';
import simulationRouter from './routes/simulation.js';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = process.cwd();
const uploadsDir = path.join(rootDir, 'uploads');

// Load .env manually
try {
  const envPath = path.resolve(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const parsed = dotenv.parse(envContent);
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch { /* .env file not found */ }

const app = express();

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',') } : undefined));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static file serving
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/candidates', candidatesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/scoring-config', configRouter);
app.use('/api/sjt', sjtRouter);
app.use('/api/nudge', nudgeRouter);
app.use('/api/personality', personalityRouter);
app.use('/api/simulation', simulationRouter);

// Apply route mapping
app.post('/api/apply', (req, res, next) => {
  req.url = '/apply';
  candidatesRouter(req, res, next);
});

// Audit log
app.get('/api/audit-log', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, c.name as candidate_name
       FROM audit_log al
       LEFT JOIN candidates c ON al.candidate_id = c.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows.map((r: Record<string, unknown>) => ({
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

// Serve client static build in production
const clientDistCandidates = [
  path.join(__dirname, '..', '..', 'client', 'dist'),  // Docker: /app/server/dist/../../client/dist
  path.join(__dirname, '..', 'client', 'dist'),          // Local dev
];
const clientDist = clientDistCandidates.find(p => fs.existsSync(p)) || clientDistCandidates[0];
if (fs.existsSync(clientDist)) {
  console.log(`📁 Serving client from: ${clientDist}`);
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', aiAvailable: !!process.env.GROQ_API_KEY });
});

// Global error handler
app.use((err: Error & { status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code,
  });
});

const PORT = parseInt(process.env.PORT || '5000');

async function start() {
  try {
    await initDatabase();
    await seedDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`InVision U API running on port ${PORT} | AI: ${process.env.GROQ_API_KEY ? 'enabled' : 'disabled'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();