import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'invision_u',
  user: process.env.DB_USER || 'invision',
  password: process.env.DB_PASSWORD || 'invision_pass',
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
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
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

export default pool;
