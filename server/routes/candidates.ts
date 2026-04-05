import { Router } from 'express';
import { readFileSync } from 'fs';
import pool from '../db.js';
import { upload } from '../middleware/upload.js';
import { analyzeEssay, isAIAvailable } from '../ai/essayAnalyzer.js';
import { calculateAchievementScore } from '../ai/achievementScorer.js';
import { calculateCompositeScore } from '../ai/compositeScorer.js';
import { RURAL_CITIES } from '../ai/constants.js';
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

    let query = 'SELECT id, name, email, password, avatar_url, university, school, city, region, is_rural, gpa, year_of_study, achievements, skills, essay_text, ai_scores, ai_summary, ai_flags, ai_model_version, ai_analyzed_at, composite_score, achievement_score, status, reviewer_notes, created_at, updated_at, interview_time, personality_scores, sjt_scores, simulation_scores, tech_score, soft_score, tech_notes, soft_notes, ielts_file_path, unt_file_path, ielts_approved, unt_approved, contact_method, contact_handle FROM candidates WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      query += ` AND (email = $${paramIdx} OR name ILIKE $${paramIdx} OR university ILIKE $${paramIdx})`;
      params.push(search.toString().includes('@') ? String(search) : `%${search}%`);
      paramIdx++;
    }

    if (status && status !== 'all') {
      query += ` AND status = $${paramIdx}`;
      params.push(String(status));
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
      school: row.school,
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
      personalityScores: row.personality_scores,
      sjtScores: row.sjt_scores,
      simulationScores: row.simulation_scores,
      techScore: row.tech_score,
      softScore: row.soft_score,
      techNotes: row.tech_notes,
      softNotes: row.soft_notes,
      essayText: row.essay_text,
      ieltsFilePath: row.ielts_file_path,
      untFilePath: row.unt_file_path,
      ieltsApproved: row.ielts_approved ?? false,
      untApproved: row.unt_approved ?? false,
      contactMethod: row.contact_method,
      contactHandle: row.contact_handle,
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
      avatarUrl: row.avatar_url,
      university: row.university,
      school: row.school,
      city: row.city,
      region: row.region,
      isRural: row.is_rural,
      gpa: row.gpa,
      yearOfStudy: row.year_of_study,
      achievements: row.achievements || [],
      skills: row.skills || [],
      essayText: row.essay_text,
      essayFilePath: row.essay_file_path,
      sjtScores: row.sjt_scores,
      sjtSummary: row.sjt_summary,
      sjtAnswers: row.sjt_answers,
      nudgeAnswers: row.nudge_answers,
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
      personalityScores: row.personality_scores,
      simulationScores: row.simulation_scores,
      techScore: row.tech_score,
      softScore: row.soft_score,
      techNotes: row.tech_notes,
      softNotes: row.soft_notes,
      ieltsFilePath: row.ielts_file_path,
      untFilePath: row.unt_file_path,
      ieltsApproved: row.ielts_approved ?? false,
      untApproved: row.unt_approved ?? false,
      ielts: row.ielts,
      unt: row.unt,
      videoUrl: row.video_url,
      contactMethod: row.contact_method,
      contactHandle: row.contact_handle,
    });
  } catch (err) {
    console.error('Error fetching candidate:', err);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// POST /api/apply - Submit new application (multipart/form-data with optional file uploads)
router.post(
  '/apply',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'essay', maxCount: 1 },
    { name: 'ielts_cert', maxCount: 1 },
    { name: 'unt_cert', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        university,
        school,
        city,
        region,
        gpa,
        yearOfStudy,
        achievements,
        skills,
        essayText,
        nudgeAnswers,
        ielts,
        unt,
        videoUrl,
        contactMethod,
        contactHandle,
      } = req.body;

      if (!name || !city) {
        return res.status(400).json({ error: 'Name and city are required' });
      }

      const tempPassword = generateTempPassword();

      const isRural = RURAL_CITIES.includes(city);

      const parsedAchievements: Achievement[] =
        typeof achievements === 'string' ? JSON.parse(achievements) : (achievements || []);

      const parsedSkills: string[] =
        typeof skills === 'string' ? JSON.parse(skills) : (skills || []);

      const parsedNudgeAnswers =
        typeof nudgeAnswers === 'string' ? JSON.parse(nudgeAnswers) : (nudgeAnswers || []);

      const achievementScore = calculateAchievementScore(parsedAchievements);

      // File paths from multer
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const avatarFile = files?.['avatar']?.[0];
      const essayFile = files?.['essay']?.[0];
      const ieltsCertFile = files?.['ielts_cert']?.[0];
      const untCertFile = files?.['unt_cert']?.[0];

      const avatarUrl = avatarFile ? `/uploads/${avatarFile.filename}` : null;
      const essayFilePath = essayFile ? `/uploads/${essayFile.filename}` : null;
      const ieltsFilePath = ieltsCertFile ? `/uploads/${ieltsCertFile.filename}` : null;
      const untFilePath = untCertFile ? `/uploads/${untCertFile.filename}` : null;

      // If essay uploaded as PDF, try to extract text
      let finalEssayText = essayText || null;
      if (!finalEssayText && essayFile) {
        try {
          const extracted = await extractPdfText(essayFile.path);
          if (extracted) finalEssayText = extracted;
        } catch { /* ignore extraction errors */ }
      }

      const weights = await getWeights();
      const compositeScore = calculateCompositeScore(null, achievementScore, isRural, weights);

      const result = await pool.query(
        `INSERT INTO candidates (
          name, email, phone, university, school, city, region, is_rural,
          gpa, year_of_study, achievements, skills,
          essay_text, essay_file_path, achievement_score,
          status, password, avatar_url, composite_score,
          nudge_answers, ielts, unt, video_url,
          ielts_file_path, unt_file_path,
          contact_method, contact_handle
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
        RETURNING id`,
        [
          name, email || null, phone || null, university || null,
          school || null,
          city, region || city, isRural,
          gpa ? parseFloat(gpa) : null, yearOfStudy ? parseInt(yearOfStudy) : null,
          JSON.stringify(parsedAchievements), parsedSkills,
          finalEssayText, essayFilePath, achievementScore,
          'new', tempPassword, avatarUrl, compositeScore,
          JSON.stringify(parsedNudgeAnswers),
          ielts ? parseFloat(ielts) : null,
          unt ? parseInt(unt) : null,
          videoUrl || null,
          ieltsFilePath,
          untFilePath,
          contactMethod || null,
          contactHandle || null,
        ]
      );

      const candidateId = result.rows[0].id;

      await pool.query(
        'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
        [candidateId, 'application_submitted', name]
      );

      res.status(201).json({
        id: candidateId,
        tempPassword,
        message: 'Application submitted successfully',
      });
    } catch (err: any) {
      console.error('Error submitting application:', err);
      res.status(500).json({ error: 'Failed to submit application', details: err?.message || String(err) });
    }
  }
);

// PATCH /api/candidates/:id/approve-cert - Approve IELTS or UNT certificate
router.patch('/:id/approve-cert', async (req, res) => {
  try {
    const { certType } = req.body as { certType: 'ielts' | 'unt' };
    if (!['ielts', 'unt'].includes(certType)) {
      return res.status(400).json({ error: 'certType must be ielts or unt' });
    }
    const col = certType === 'ielts' ? 'ielts_approved' : 'unt_approved';
    await pool.query(
      `UPDATE candidates SET ${col} = true, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    await pool.query(
      'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
      [req.params.id, 'cert_approved', certType.toUpperCase()]
    );
    res.json({ message: 'Certificate approved' });
  } catch (err) {
    console.error('Error approving cert:', err);
    res.status(500).json({ error: 'Failed to approve certificate' });
  }
});

// POST /api/candidates/:id/arbitration - AI analysis of panel score discrepancy
router.post('/:id/arbitration', async (req, res) => {
  try {
    const candidate = await pool.query(
      `SELECT name, tech_score, soft_score, tech_notes, soft_notes,
              ai_scores, ai_summary, composite_score
       FROM candidates WHERE id = $1`,
      [req.params.id]
    );
    if (candidate.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    const c = candidate.rows[0];

    const techScore = c.tech_score ?? 0;
    const softScore = c.soft_score ?? 0;
    const techNotes = c.tech_notes || 'No notes provided';
    const softNotes = c.soft_notes || 'No notes provided';
    const gap = Math.abs(techScore - softScore);

    // If Groq is available, run AI analysis
    if (process.env.GROQ_API_KEY) {
      try {
        const { getGroqClient, GROQ_MODEL: MODEL, parseAIJson } = await import('../ai/constants.js');
        const groq = getGroqClient();

        const prompt = `You are an expert arbitration analyst for InVision U, a prestigious scholarship program.

A candidate named "${c.name}" has conflicting scores from two evaluation panels:
- Panel A (Technical): ${techScore}/100
  Notes: "${techNotes}"
- Panel B (Soft Skills): ${softScore}/100
  Notes: "${softNotes}"
- Score gap: ${gap} points
- AI Essay Score: ${c.composite_score?.toFixed(1) || 'N/A'}/100

Analyze this discrepancy and return a JSON object (no markdown, no explanation, raw JSON only):
{
  "summary": "2-3 sentence analysis of the conflict in English",
  "disagreementFactors": ["factor1", "factor2", "factor3"],
  "panelAAnalysis": "1-2 sentences on why Technical panel rated this way",
  "panelBAnalysis": "1-2 sentences on why Soft Skills panel rated this way",
  "verdict": "2-3 sentence recommendation for the admissions committee",
  "suggestedScore": <number between ${Math.min(techScore, softScore)} and ${Math.max(techScore, softScore)}>
}`;

        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 600,
        });

        const text = completion.choices[0]?.message?.content || '';
        const parsed = parseAIJson<Record<string, unknown>>(text);
        if (parsed) {
          return res.json({
            candidateName: c.name,
            panelA: { score: techScore, note: techNotes, analysis: parsed.panelAAnalysis },
            panelB: { score: softScore, note: softNotes, analysis: parsed.panelBAnalysis },
            summary: parsed.summary,
            disagreementFactors: parsed.disagreementFactors || [],
            verdict: parsed.verdict,
            suggestedScore: parsed.suggestedScore,
          });
        }
      } catch (aiErr) {
        console.error('Groq arbitration error:', aiErr);
        // Fall through to deterministic fallback
      }
    }

    // Deterministic fallback (no AI available)
    const higherPanel = techScore >= softScore ? 'Technical' : 'Soft Skills';
    res.json({
      candidateName: c.name,
      panelA: { score: techScore, note: techNotes, analysis: techNotes },
      panelB: { score: softScore, note: softNotes, analysis: softNotes },
      summary: `A ${gap}-point gap between panels was detected. ${higherPanel} panel scored higher. Manual review recommended.`,
      disagreementFactors: ['Evaluation criteria interpretation', 'Different panel observations', 'Potential stress-related performance variation'],
      verdict: `Score gap of ${gap} points requires committee review. Consider averaging both scores (${Math.round((techScore + softScore) / 2)}/100) unless a specific disqualifying factor was observed.`,
      suggestedScore: Math.round((techScore + softScore) / 2),
    });
  } catch (err) {
    console.error('Arbitration error:', err);
    res.status(500).json({ error: 'Failed to generate arbitration report' });
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

    // 4. ЛОГИКА АВТО-СТАТУСА: если обе панели оценили → под_ревью или арбитраж
    if (updatedCandidate.tech_score !== null && updatedCandidate.soft_score !== null) {
      const diff = Math.abs(updatedCandidate.tech_score - updatedCandidate.soft_score);
      if (diff > 40) {
        // Конфликт оценок → арбитраж
        if (updatedCandidate.status !== 'arbitration') {
          const arbResult = await pool.query(
            "UPDATE candidates SET status = 'arbitration', updated_at = NOW() WHERE id = $1 RETURNING *",
            [id]
          );
          updatedCandidate = arbResult.rows[0];
          await pool.query(
            'INSERT INTO audit_log (candidate_id, action, new_value) VALUES ($1, $2, $3)',
            [id, 'auto_arbitration_triggered', `Gap: ${diff}`]
          );
        }
      } else if (updatedCandidate.status === 'interview') {
        // Обе оценки есть, конфликта нет → отправляем на проверку
        const urResult = await pool.query(
          "UPDATE candidates SET status = 'under_review', updated_at = NOW() WHERE id = $1 RETURNING *",
          [id]
        );
        updatedCandidate = urResult.rows[0];
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