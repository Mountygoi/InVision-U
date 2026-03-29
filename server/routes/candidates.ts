import { Router } from 'express';
import { readFileSync } from 'fs';
import pool from '../db.js';
import { upload } from '../middleware/upload.js';
import { analyzeEssay, isAIAvailable } from '../ai/essayAnalyzer.js';
import { calculateAchievementScore } from '../ai/achievementScorer.js';
import { calculateCompositeScore } from '../ai/compositeScorer.js';
import type { Achievement, ScoringWeights } from '../types.js';
import { DEFAULT_WEIGHTS } from '../types.js';

// pdf-parse has problematic ESM exports, use dynamic import with cast
async function extractPdfText(filePath: string): Promise<string> {
  try {
    const mod = await (Function('return import("pdf-parse")')() as Promise<any>);
    const parseFn = mod.default ?? mod;
    const buffer = readFileSync(filePath);
    const result = await parseFn(buffer);
    return result.text || '';
  } catch {
    return '';
  }
}

// НОВОЕ: Генерация временного пароля (6 символов, верхний регистр)
const generateTempPassword = () => Math.random().toString(36).slice(-6).toUpperCase();

const router = Router();

// Helper: get current weights
async function getWeights(): Promise<ScoringWeights> {
  const result = await pool.query('SELECT weights FROM scoring_config WHERE id = 1');
  return result.rows[0]?.weights ?? DEFAULT_WEIGHTS;
}

// GET /api/candidates - List all candidates
router.get('/', async (req, res) => {
  try {
    const { search, status, sort = 'composite_score', order = 'desc' } = req.query;

    let query = 'SELECT id, name, email, password, avatar_url, university, city, region, is_rural, gpa, year_of_study, achievements, skills, ai_scores, ai_summary, ai_flags, ai_model_version, ai_analyzed_at, composite_score, achievement_score, status, reviewer_notes, created_at, updated_at, interview_time FROM candidates WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      query += ` AND (email = $${paramIdx} OR name ILIKE $${paramIdx} OR university ILIKE $${paramIdx})`;
      params.push(search.toString().includes('@') ? search : `%${search}%`);
      paramIdx++;
    }

    if (status && status !== 'all') {
      query += ` AND status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    const allowedSorts = ['composite_score', 'created_at', 'name', 'achievement_score'];
    const sortCol = allowedSorts.includes(sort as string) ? sort : 'composite_score';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    const result = await pool.query(query, params);

    const candidates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      avatarUrl: row.avatar_url, // Добавлено поле аватарки
      university: row.university,
      city: row.city,
      region: row.region,
      isRural: row.is_rural,
      gpa: row.gpa,
      yearOfStudy: row.year_of_study,
      achievements: row.achievements || [],
      skills: row.skills || [],
      aiScores: row.ai_scores,
      aiSummary: row.ai_summary,
      aiFlags: row.ai_flags,
      aiModelVersion: row.ai_model_version,
      aiAnalyzedAt: row.ai_analyzed_at,
      compositeScore: row.composite_score,
      achievementScore: row.achievement_score,
      status: row.status,
      reviewerNotes: row.reviewer_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      interviewTime: row.interview_time,
    }));

    res.json(candidates);
  } catch (err) {
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// GET /api/candidates/:id - Single candidate with full detail
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM candidates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatar_url, // Добавлено поле аватарки
      university: row.university,
      city: row.city,
      region: row.region,
      isRural: row.is_rural,
      gpa: row.gpa,
      yearOfStudy: row.year_of_study,
      achievements: row.achievements || [],
      skills: row.skills || [],
      essayText: row.essay_text,
      essayFilePath: row.essay_file_path,
      aiScores: row.ai_scores,
      aiSummary: row.ai_summary,
      aiFlags: row.ai_flags,
      aiModelVersion: row.ai_model_version,
      aiAnalyzedAt: row.ai_analyzed_at,
      compositeScore: row.composite_score,
      achievementScore: row.achievement_score,
      status: row.status,
      reviewerNotes: row.reviewer_notes,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      interviewTime: row.interview_time,
    });
  } catch (err) {
    console.error('Error fetching candidate:', err);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// POST /api/apply - Submit new application
// ИСПРАВЛЕНО: Теперь принимаем несколько полей (essay и avatar)
router.post('/apply', upload.fields([
  { name: 'essay', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, phone, university, city, region, gpa, yearOfStudy, achievements, skills, essayText } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'Name and city are required' });
    }

    const tempPassword = generateTempPassword();

    // Получаем доступ к файлам
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const essayFile = files['essay'] ? files['essay'][0] : null;
    const avatarFile = files['avatar'] ? files['avatar'][0] : null;

    // Ссылка на фото для сохранения в БД
    const avatarUrl = avatarFile 
      ? `http://localhost:5000/uploads/${avatarFile.filename}` 
      : null;

    const ruralCities = ['Qyzylorda', 'Atyrau', 'Aktau', 'Turkistan', 'Taraz', 'Oral', 'Kostanay', 'Petropavl'];
    const isRural = ruralCities.includes(city);

    const parsedAchievements: Achievement[] = achievements ? JSON.parse(achievements) : [];
    const parsedSkills: string[] = skills ? JSON.parse(skills) : [];
    const achievementScore = calculateAchievementScore(parsedAchievements);

    let finalEssayText = essayText || '';
    const essayFilePath = essayFile?.path || null;

    if (essayFile && !finalEssayText) {
      const pdfText = await extractPdfText(essayFile.path);
      if (pdfText) finalEssayText = pdfText;
    }

    const weights = await getWeights();
    const initialCompositeScore = calculateCompositeScore(null, achievementScore, isRural, weights);

    const result = await pool.query(
      `INSERT INTO candidates (
        name, email, phone, university, city, region, is_rural,
        gpa, year_of_study, achievements, skills,
        essay_text, essay_file_path,
        composite_score, achievement_score, status, password, avatar_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'new', $16, $17)
      RETURNING id`,
      [
        name, email || null, phone || null, university || null,
        city, region || city, isRural,
        gpa ? parseFloat(gpa) : null, yearOfStudy ? parseInt(yearOfStudy) : null,
        JSON.stringify(parsedAchievements), parsedSkills,
        finalEssayText || null, essayFilePath,
        initialCompositeScore, achievementScore, tempPassword, avatarUrl
      ]
    );

    const candidateId = result.rows[0].id;

    await pool.query(
      'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
      [candidateId, 'application_submitted', name]
    );

    if (finalEssayText && isAIAvailable()) {
      analyzeAndUpdate(candidateId, finalEssayText, name, parsedAchievements, university || '', city, weights).catch(err => {
        console.error('Async AI analysis failed:', err);
      });
    }

    console.log(`New application: ${name} (Pass: ${tempPassword}, Avatar: ${!!avatarUrl})`);
    
    res.status(201).json({ 
      id: candidateId, 
      tempPassword: tempPassword,
      message: 'Application submitted successfully' 
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// PATCH /api/candidates/:id/password - Change password
router.patch('/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password is required' });

    await pool.query(
      'UPDATE candidates SET password = $1, updated_at = NOW() WHERE id = $2',
      [newPassword, req.params.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// PATCH /api/candidates/:id/schedule - Set interview time
router.patch('/:id/schedule', async (req, res) => {
  try {
    const { interviewTime } = req.body;
    
    await pool.query(
      'UPDATE candidates SET interview_time = $1, updated_at = NOW() WHERE id = $2',
      [interviewTime, req.params.id]
    );

    await pool.query(
      'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
      [req.params.id, 'interview_scheduled', interviewTime]
    );

    res.json({ message: 'Interview time scheduled successfully' });
  } catch (err) {
    console.error('Error scheduling interview:', err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// POST /api/candidates/:id/analyze - Re-trigger AI analysis
router.post('/:id/analyze', async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({ error: 'AI analysis is not available. Set GEMINI_API_KEY in .env' });
    }

    const candidate = await pool.query('SELECT * FROM candidates WHERE id = $1', [req.params.id]);
    if (candidate.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const c = candidate.rows[0];
    if (!c.essay_text) {
      return res.status(400).json({ error: 'Candidate has no essay to analyze' });
    }

    const weights = await getWeights();
    await analyzeAndUpdate(c.id, c.essay_text, c.name, c.achievements || [], c.university || '', c.city, weights);

    const updated = await pool.query('SELECT ai_scores, ai_summary, ai_flags, composite_score FROM candidates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Analysis complete', ...updated.rows[0] });
  } catch (err: any) {
    console.error('Error analyzing candidate:', err?.message || err);
    res.status(500).json({ error: 'Failed to analyze candidate', details: err?.message || String(err) });
  }
});

// PATCH /api/candidates/:id/status - Update status AND scores
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      tech_score, 
      soft_score, 
      tech_notes, 
      soft_notes, 
      reviewer_notes 
    } = req.body;

    // 1. Проверка валидности статуса (добавляем 'arbitration')
    const validStatuses = ['new', 'under_review', 'interview', 'accepted', 'declined', 'waitlisted', 'arbitration'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 2. Получаем текущие данные для лога
    const current = await pool.query('SELECT status, tech_score, soft_score FROM candidates WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // 3. ОБНОВЛЕНИЕ БАЗЫ (используем COALESCE, чтобы не затирать существующие данные)
    const updateQuery = `
      UPDATE candidates SET 
        status = COALESCE($1, status),
        tech_score = COALESCE($2, tech_score),
        soft_score = COALESCE($3, soft_score),
        tech_notes = COALESCE($4, tech_notes),
        soft_notes = COALESCE($5, soft_notes),
        reviewer_notes = COALESCE($6, reviewer_notes),
        updated_at = NOW()
      WHERE id = $7 RETURNING *`;

    const result = await pool.query(updateQuery, [status, tech_score, soft_score, tech_notes, soft_notes, reviewer_notes, id]);
    let updatedCandidate = result.rows[0];

    // 4. ЛОГИКА АВТО-АРБИТРАЖА (Киллер-фича для хакатона)
    // Проверяем разрыв, если обе оценки теперь в наличии
    if (updatedCandidate.tech_score !== null && updatedCandidate.soft_score !== null) {
      const diff = Math.abs(updatedCandidate.tech_score - updatedCandidate.soft_score);
      if (diff > 40 && updatedCandidate.status !== 'arbitration') {
        const arbResult = await pool.query(
          "UPDATE candidates SET status = 'arbitration', updated_at = NOW() WHERE id = $1 RETURNING *",
          [id]
        );
        updatedCandidate = arbResult.rows[0];
        
        // Логируем триггер арбитража
        await pool.query(
          'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
          [id, 'auto_arbitration_triggered', `Gap: ${diff}`]
        );
      }
    }

    // 5. Запись в обычный Audit Log
    await pool.query(
      'INSERT INTO audit_log (candidate_id, action, old_value, new_value) VALUES ($1, $2, $3, $4)',
      [id, 'status_or_score_change', current.rows[0].status, updatedCandidate.status]
    );

    res.json(updatedCandidate);
  } catch (err) {
    console.error('Error updating candidate status/scores:', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});
// PATCH /api/candidates/:id/review - Add reviewer notes
router.patch('/:id/review', async (req, res) => {
  try {
    const { notes, reviewedBy } = req.body;
    await pool.query(
      'UPDATE candidates SET reviewer_notes = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW() WHERE id = $3',
      [notes, reviewedBy || 'admin', req.params.id]
    );

    await pool.query(
      'INSERT INTO audit_log (candidate_id, action, new_value, performed_by) VALUES ($1, $2, $3, $4)',
      [req.params.id, 'review_added', notes, reviewedBy || 'admin']
    );

    res.json({ message: 'Review notes saved' });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// Helper: run AI analysis and update DB
async function analyzeAndUpdate(
  candidateId: string,
  essayText: string,
  name: string,
  achievements: Achievement[],
  university: string,
  city: string,
  weights: ScoringWeights
): Promise<void> {
  const analysis = await analyzeEssay(essayText, name, achievements, university, city);

  const achievementResult = await pool.query('SELECT achievement_score, is_rural FROM candidates WHERE id = $1', [candidateId]);
  const { achievement_score, is_rural } = achievementResult.rows[0];
  const compositeScore = calculateCompositeScore(analysis.scores, achievement_score, is_rural, weights);

  await pool.query(
    `UPDATE candidates SET
      ai_scores = $1, ai_summary = $2, ai_flags = $3,
      ai_model_version = $4, ai_analyzed_at = $5,
      composite_score = $6, updated_at = NOW()
    WHERE id = $7`,
    [
      JSON.stringify(analysis.scores), analysis.summary, JSON.stringify(analysis.flags),
      analysis.modelVersion, analysis.analyzedAt,
      compositeScore, candidateId
    ]
  );
}

export default router;