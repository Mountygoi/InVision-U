import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// DigitalOcean managed DB uses self-signed CA
if (process.env.DATABASE_URL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || '127.0.0.1'),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'invision_u'),
  user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'invision'),
  password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'invision_pass'),
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export async function initDatabase(): Promise<void> {
  let client;
  try {
    client = await pool.connect();

    // Check if tables already exist
    const { rows } = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'candidates'`
    );

    if (rows.length > 0) {
      console.log('✅ Database tables already exist, running migrations...');
    } else {
      console.log('⏳ Creating database tables...');
      // Try granting schema access first (works if connected as admin/doadmin)
      try {
        const { rows: userRows } = await client.query(`SELECT current_user AS u`);
        const currentUser = userRows[0]?.u;
        if (currentUser) {
          await client.query(`GRANT CREATE ON SCHEMA public TO ${currentUser}`);
        }
      } catch { /* ignore – may not have GRANT privilege */ }

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
          status TEXT DEFAULT 'new' CHECK(status IN ('new','under_review','interview','accepted','declined','waitlisted','arbitration')),
          tech_score INTEGER,
          soft_score INTEGER,
          tech_notes TEXT,
          soft_notes TEXT,
          reviewer_notes TEXT,
          reviewed_by TEXT,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          candidate_id UUID REFERENCES candidates(id),
          action TEXT NOT NULL,
          old_value TEXT,
          new_value TEXT,
          performed_by TEXT DEFAULT 'admin',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS scoring_config (
          id INTEGER PRIMARY KEY DEFAULT 1,
          weights JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      console.log('✅ Database tables created');
    }

    // Migrations — safe to run even if columns exist
    const alterStatements = [
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS personality_scores JSONB`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS password TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interview_time TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS sjt_scores JSONB`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS simulation_scores JSONB`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ielts REAL`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS unt INTEGER`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS video_url TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS telegram TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS nudge_answers JSONB DEFAULT '[]'`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS sjt_answers JSONB`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS sjt_summary TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ielts_file_path TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS unt_file_path TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ielts_approved BOOLEAN DEFAULT false`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS unt_approved BOOLEAN DEFAULT false`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS tech_score INTEGER`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS soft_score INTEGER`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS tech_notes TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS soft_notes TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS school TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS contact_method TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS contact_handle TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS essay_text_original TEXT`,
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS learnability_score JSONB`,
    ];

    for (const stmt of alterStatements) {
      try { await client.query(stmt); } catch { /* column may already exist */ }
    }

    console.log('✅ Database migrations complete');
  } catch (err: any) {
    if (err?.code === '42501') {
      console.error('⚠️  Permission denied on schema public. Tables may need to be created manually.');
      console.error('   Run in DO database console: GRANT CREATE ON SCHEMA public TO your_user;');
      console.error('   Or create the tables manually using the SQL from db.ts');
      // Don't throw — let the server start if tables already exist from a prior deployment
    } else {
      console.error('❌ Database init error:', err);
      throw err;
    }
  } finally {
    if (client) client.release();
  }
}

export default pool;