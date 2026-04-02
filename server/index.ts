import express from 'express';
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

// 1. ИСПРАВЛЕНИЕ: Используем абсолютный путь от корня процесса для надежности
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

console.log('GROQ_API_KEY loaded:', !!process.env.GROQ_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. ИСПРАВЛЕНИЕ: Проверяем и создаем папку, выводим путь в консоль для проверки
console.log(`📁 Попытка раздачи статики из: ${uploadsDir}`);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Папка uploads создана');
}

// РАЗДАЧА ФАЙЛОВ (теперь по абсолютному пути)
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
app.get('/api/audit-log', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, c.name as candidate_name
       FROM audit_log al
       LEFT JOIN candidates c ON al.candidate_id = c.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows.map((r: any) => ({
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
  res.json({ status: 'ok', aiAvailable: !!process.env.GROQ_API_KEY });
});

// Global error handler — converts any middleware error (incl. multer) to JSON
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Global error handler caught:', err);
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

    app.listen(PORT, () => {
      console.log(`
  InVision U API Server
  =====================
  API Base:         http://localhost:${PORT}/api
  Candidates:       http://localhost:${PORT}/api/candidates
  Static Assets:    http://localhost:${PORT}/uploads  <-- ПРОВЕРЬ ТУТ
  AI Available:     ${!!process.env.GROQ_API_KEY ? 'Yes' : 'No'}
      `);
      console.log(`Проверь свою картинку тут: http://localhost:${PORT}/uploads/1774736949109-461126575-POSTER-LOA.png`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();