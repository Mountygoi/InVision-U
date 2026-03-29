# InVision U - Intelligent Candidate Selection Support System

> **Hackathon**: Decentrathon 5.0 | **Track**: AI inDrive | **Team**: BLUE NODE

---

## 1. Problem Statement

InVision U is an innovative university with 100% scholarships funded by inDrive, launched in Kazakhstan to educate future leaders, entrepreneurs, and project builders. The admissions committee faces critical challenges:

| Problem | Impact |
|---------|--------|
| Talented applicants with low ability to "sell themselves" are lost | The process sees the **application**, not the **person** |
| Standard forms fail to capture early signals of leadership potential | Strong candidates **self-filter out** before applying |
| Generative AI blurs the authentic voice in essays | Traditional text formats become **unreliable** |
| Manual screening quality declines as applications grow | Scale and depth of assessment are **incompatible** |

## 2. Our Solution

An AI-powered multi-stage candidate evaluation platform that goes beyond traditional application screening:

```
Candidate Journey:
/apply ──> Fill Form ──> AI Nudge Assistant ──> SJT Test ──> AI Analysis ──> Admin Review
```

### Core Innovation: 3-Layer Assessment

| Layer | What | Why |
|-------|------|-----|
| **AI Nudge Assistant** | Generates personalized questions based on draft content, helps candidates reveal their true potential | Solves "can't sell themselves" problem - AI draws out the real person |
| **Situational Judgement Test (SJT)** | 4 real-world scenarios evaluating decision-making across 5 behavioral axes | Captures leadership signals that essays miss; resistant to AI-generated text |
| **6-Dimension Essay Analysis** | LLM evaluates motivation, leadership, resilience, creativity, technical potential, social impact | Deep scoring with evidence-based explanations and AI-written detection |

### How This Addresses inVision U's Desired Directions

| TOR Direction | Our Implementation |
|---------------|-------------------|
| **Leadership potential identification** | SJT behavioral test + "Leadership" dimension in essay analysis |
| **Assessment of "path traveled"** | "Resilience" dimension evaluates growth trajectory, not just achievements; rural bonus for context |
| **Detection of generative AI usage** | `is_ai_generated` flag with probability scoring in essay analysis |
| **Predictive analytics / lead scoring** | Composite score combining AI essay scores + SJT scores + achievement scores |
| **Multimodal assessment** | Structured data + free-form essay + SJT behavioral responses + Nudge Q&A dialogue |

## 3. Architecture

```
                          CANDIDATE FLOW
                          ═════════════
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │  /apply      │───>│  /test       │───>│  /status     │
    │  Application │    │  SJT Test    │    │  Dashboard   │
    │  + AI Nudge  │    │  (4 scenes)  │    │  + Results   │
    └──────────────┘    └──────┬───────┘    └──────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │   (TypeScript/ESM)  │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Groq API   │  │ PostgreSQL   │  │ Deterministic│
    │  LLaMA 3.3  │  │ 16 (Docker)  │  │ Scorers      │
    │  70B        │  │              │  │              │
    └─────────────┘  └──────────────┘  └──────────────┘
     - Essay AI       - Candidates      - Achievements
     - SJT AI         - Audit Log       - Composite
     - Nudge AI       - Config          - Weights

                          ADMIN PANEL
                          ══════════
    ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐
    │/admin    │  │/admin      │  │/admin    │  │/admin     │
    │Dashboard │  │/candidates │  │/settings │  │/scheduler │
    │Stats     │  │AI Review   │  │Weights   │  │Interviews │
    └──────────┘  └────────────┘  └──────────┘  └───────────┘
```

## 4. AI Pipeline Detail

### 4.1 Essay Analyzer (`server/ai/essayAnalyzer.ts`)

Uses **Groq API** with **LLaMA 3.3 70B Versatile** model.

**Input**: Essay text, candidate name, achievements, university, city

**Output** (structured JSON):
```json
{
  "scores": {
    "motivation":         { "score": 0-100, "confidence": 0.0-1.0, "evidence": "..." },
    "leadership":         { "score": 0-100, "confidence": 0.0-1.0, "evidence": "..." },
    "technicalPotential": { "score": 0-100, "confidence": 0.0-1.0, "evidence": "..." },
    "creativity":         { "score": 0-100, "confidence": 0.0-1.0, "evidence": "..." },
    "resilience":         { "score": 0-100, "confidence": 0.0-1.0, "evidence": "..." },
    "socialImpact":       { "score": 0-100, "confidence": 0.0-1.0, "evidence": "..." }
  },
  "flags": {
    "is_ai_generated": true/false,
    "generic_content": true/false,
    "high_potential_outlier": true/false
  },
  "summary": "Natural language assessment for human reviewers"
}
```

**6 Scoring Dimensions explained**:

| Dimension | What it measures | Why it matters for inVision U |
|-----------|-----------------|-------------------------------|
| Motivation | Genuine desire to learn and grow | Core predictor of student success |
| Leadership | Initiative, influence, responsibility-taking | inVision U mission: educate future leaders |
| Technical Potential | Analytical thinking, problem-solving aptitude | Foundation for entrepreneurship |
| Creativity | Original thinking, unconventional approaches | Innovation capacity |
| Resilience | Overcoming obstacles, "path traveled" | Identifies diamonds in the rough |
| Social Impact | Desire to contribute to community/society | Alignment with inDrive social mission |

### 4.2 SJT Analyzer (`server/ai/sjtAnalyzer.ts`)

**4 situational scenarios** in Russian (Kazakhstan context):
1. Leadership Crisis - team conflict with deadline pressure
2. Ethical Dilemma - plagiarism discovery before presentation
3. Limited Resources - building MVP for rural school with no budget
4. Recovery After Failure - startup demo-day crash

**5-axis behavioral scoring**:
- Leadership, Problem-Solving, Teamwork, Stress Resilience, Ethics

**Output**: Per-scenario feedback + overall behavioral profile + personality summary

### 4.3 AI Nudge Assistant (`server/ai/nudgeAnalyzer.ts`)

Analyzes the candidate's draft application and generates **3-5 personalized questions** that help reveal hidden potential. Candidates can answer inline, and responses are saved with the application.

**Example**: If a candidate mentions an olympiad but no details, the AI asks: "What was your specific role? What did you learn from the experience?"

This directly addresses the TOR problem: *"Talented applicants with low ability to 'sell themselves' are lost."*

### 4.4 Achievement Scorer (`server/ai/achievementScorer.ts`)

Deterministic, transparent scoring:

| Achievement Type | Points |
|-----------------|--------|
| Olympiad (National) | 20 pts |
| Olympiad (Regional) | 12 pts |
| Olympiad (City) | 8 pts |
| Volunteering | 5 pts/year (max 20) |
| Project (published/awarded) | 15 pts |
| Project (regular) | 10 pts |
| Award | 8 pts |

### 4.5 Composite Score (`server/ai/compositeScorer.ts`)

```
compositeScore = (weightedAiAverage * scaleFactor) + achievementBonus + ruralBonus
```

- **weightedAiAverage**: Weighted mean of 6 AI dimension scores (weights configurable by admin)
- **achievementBonus**: Deterministic score from achievements (capped)
- **ruralBonus**: Equity adjustment for candidates from underrepresented regions (configurable, default: 5 pts)

All weights are **adjustable by the admissions committee** via Settings page - ensuring human control over the scoring formula.

## 5. Data Model

### Candidates Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name, email, phone | TEXT | Personal info |
| university, city, region | TEXT | Educational background |
| is_rural | BOOLEAN | Equity flag (auto-detected from city) |
| gpa | REAL | Grade point average |
| achievements | JSONB | Array of {type, title, description, year, level} |
| skills | TEXT[] | Array of skill tags |
| essay_text | TEXT | Motivation essay content |
| nudge_answers | JSONB | Responses to AI-generated questions |
| sjt_answers | JSONB | SJT scenario responses |
| sjt_scores | JSONB | SJT behavioral scores (5 axes) |
| sjt_summary | TEXT | AI personality profile |
| ai_scores | JSONB | 6-dimension essay scores with confidence |
| ai_summary | TEXT | Natural language assessment |
| ai_flags | JSONB | AI-written detection, quality flags |
| composite_score | REAL | Final weighted score |
| achievement_score | REAL | Deterministic achievement points |
| status | TEXT | new / under_review / interview / accepted / declined / waitlisted |

### Audit Log Table

Every status change, score update, and admin action is logged with timestamp and actor - ensuring full transparency and accountability.

### Scoring Config Table

Stores adjustable weights as JSONB, allowing the admissions committee to tune the scoring formula without code changes.

## 6. Fairness & Explainability

### Human-in-the-Loop

AI **never** makes autonomous admission/rejection decisions. The system:
1. Generates scores and recommendations
2. Provides evidence and explanations
3. The admissions committee reviews and decides
4. All decisions are logged in the audit trail

### Bias Mitigation

- **Rural equity bonus**: Adjustable bonus for candidates from underrepresented regions (Qyzylorda, Atyrau, Aktau, Turkistan, etc.)
- **"Resilience" dimension**: Specifically evaluates "path traveled" - growth trajectory relative to opportunities available
- **Anti-discrimination prompt**: AI is explicitly instructed not to use gender, ethnicity, or socioeconomic status as negative factors
- **Configurable weights**: Committee can adjust dimension weights to reflect institutional values

### Transparency

- Every AI score includes **confidence level** (0.0-1.0) and **evidence** (quotes from essay)
- **Composite formula** is fully visible and adjustable
- **Audit log** tracks all changes with timestamps
- Candidates see their AI assessment in their status portal

## 7. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 8 |
| UI Library | Ant Design | 5+ |
| Charts | Recharts | 3.8 |
| Backend | Express.js + TypeScript (ESM) | Express 4.19 |
| Database | PostgreSQL | 16 (Docker) |
| AI/LLM | Groq API (LLaMA 3.3 70B Versatile) | groq-sdk |
| File Upload | Multer + pdf-parse | PDF text extraction |
| Video | MiroTalk P2P | WebRTC interviews |

## 8. Quick Start

### Prerequisites
- **Node.js** 18+
- **Docker** & Docker Compose
- **Groq API key** (free at [console.groq.com](https://console.groq.com))

### Setup

```bash
# 1. Clone repository
git clone https://github.com/Mountygoi/InVision-U.git
cd InVision-U

# 2. Start PostgreSQL via Docker
docker compose up -d

# 3. Setup & start server
cd server
npm install
# Create .env with: GROQ_API_KEY=your_key_here
npm run dev
# Server runs on http://localhost:5000

# 4. Setup & start client (new terminal)
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

### Environment Variables (`server/.env`)

```env
GROQ_API_KEY=gsk_xxxxx          # Required - Groq API key
DB_HOST=127.0.0.1               # PostgreSQL host
DB_PORT=5433                    # PostgreSQL port (mapped in docker-compose)
DB_NAME=invision_u              # Database name
PORT=5000                       # Server port
```

### Access Points

| URL | Description |
|-----|-------------|
| http://localhost:5173/apply | Candidate application form |
| http://localhost:5173/test | Situational Judgement Test |
| http://localhost:5173/login | Candidate login |
| http://localhost:5173/status | Candidate status portal |
| http://localhost:5173/admin | Admin dashboard |
| http://localhost:5173/admin/candidates | Candidate review panel |
| http://localhost:5173/admin/settings | Scoring weight configuration |
| http://localhost:5173/admin/scheduler | Interview scheduler |

## 9. API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/apply` | Submit new candidate application |
| GET | `/api/candidates` | List candidates (search, filter, sort) |
| GET | `/api/candidates/:id` | Get full candidate detail with AI scores |
| POST | `/api/candidates/:id/analyze` | Re-trigger AI essay analysis |
| PATCH | `/api/candidates/:id/status` | Update status (+ auto-arbitration logic) |
| PATCH | `/api/candidates/:id/review` | Add reviewer notes |
| PATCH | `/api/candidates/:id/schedule` | Schedule interview |
| PATCH | `/api/candidates/:id/password` | Change candidate password |
| POST | `/api/sjt/analyze` | Analyze SJT responses + trigger full AI pipeline |
| POST | `/api/nudge` | Generate personalized feedback questions |
| GET | `/api/stats` | Dashboard aggregations |
| GET | `/api/scoring-config` | Get current scoring weights |
| PUT | `/api/scoring-config` | Update weights & recalculate all scores |
| GET | `/api/audit-log` | Audit trail (last 50 actions) |
| GET | `/api/health` | Health check & AI availability |

## 10. User Scenarios

### Scenario 1: Candidate Applies

1. Candidate opens `/apply`, fills personal info, achievements, skills
2. Writes motivation essay (or uploads PDF)
3. Clicks **"Get AI Feedback"** - AI Nudge generates personalized questions
4. Candidate answers questions (optional) - answers are saved with application
5. Clicks **"Next: Situational Test"** - application saved to DB
6. Completes 4 SJT scenarios with explanations
7. Clicks **"Submit Application"** - AI pipeline runs:
   - SJT behavioral analysis (5 axes)
   - Essay analysis (6 dimensions + AI detection)
   - Composite score calculation
8. Receives temporary password, redirected to status portal

### Scenario 2: Admissions Committee Reviews

1. Opens `/admin` - sees real-time dashboard (total apps, score distribution, regional breakdown)
2. Goes to `/admin/candidates` - sees ranked list with composite scores
3. Filters by status/search, sorts by score
4. Clicks candidate - sees:
   - AI summary (natural language)
   - Radar chart of 6 dimensions
   - AI flags (AI-written probability, content quality)
   - Evidence quotes from essay
   - Achievement list
5. Changes status (new → under_review → interview → accepted/declined)
6. All actions logged to audit trail

### Scenario 3: Admin Adjusts Weights

1. Opens `/admin/settings`
2. Adjusts dimension weights (e.g., increase "Resilience" weight for rural-focused cohort)
3. Saves - all composite scores recalculated in real-time
4. Returns to candidates list - ranking reflects new weights

## 11. Limitations & Known Issues

- **LLM consistency**: Same essay may receive slightly different scores on re-analysis (mitigated by caching results)
- **Language**: AI prompt is in Russian; Kazakh-language essays may score slightly lower
- **PDF parsing**: Complex PDF layouts may not extract text perfectly
- **No real dataset**: Demo uses seeded data; real validation would require labeled admissions data
- **Passwords**: Stored in plain text (prototype only - would use bcrypt in production)
- **No rate limiting**: API endpoints are not rate-limited (would add express-rate-limit in production)
- **Single LLM**: Currently uses only Groq/LLaMA; production would benefit from model ensemble

## 12. Future Development (Stage 2+)

- [ ] Baseline comparison dashboard (random vs rule-based vs AI scoring)
- [ ] Model validation page with error analysis
- [ ] Evidence trail UI (dimension → quote → score explanation)
- [ ] Video interview AI analysis (tone, engagement signals)
- [ ] Telegram bot for candidate interaction
- [ ] Password hashing and proper authentication
- [ ] Rate limiting and API security
- [ ] Kazakh language optimization in AI prompts
- [ ] A/B testing framework for scoring approaches

## 13. Team

**BLUE NODE** - Decentrathon 5.0, AI inDrive Track

## License

MIT
