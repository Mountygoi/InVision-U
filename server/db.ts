import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433'), 
  database: process.env.DB_NAME || 'invision_u', 
  user: 'invision',        // МЕНЯЕМ ОБРАТНО НА ТВОЙ ЛОГИН
  password: 'invision_pass', // МЕНЯЕМ ОБРАТНО НА ТВОЙ ПАРОЛЬ
});

export async function initDatabase(): Promise<void> {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        university TEXT,
        city TEXT NOT NULL,
        region TEXT,
        is_rural BOOLEAN DEFAULT false,
        gpa REAL,
        year_of_study INTEGER,
        achievements JSONB DEFAULT '[]',
        skills TEXT[] DEFAULT '{}',
        essay_text TEXT,
        essay_file_path TEXT,
        ai_scores JSONB,
        ai_summary TEXT,
        ai_flags JSONB,
        ai_model_version TEXT,
        ai_analyzed_at TIMESTAMPTZ,
        composite_score REAL DEFAULT 0,
        achievement_score REAL DEFAULT 0,
        status TEXT DEFAULT 'new' CHECK(status IN ('new','under_review','interview','accepted','declined','waitlisted')),
        reviewer_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_id UUID REFERENCES candidates(id),
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        performed_by TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scoring_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        weights JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Database init error:', err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

export default pool;