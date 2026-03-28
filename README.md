# InVision U — AI-Powered Candidate Selection System

**Decentrathon 5.0 | AI inDrive Track**

An intelligent candidate screening support system for InVision U, an innovative university with 100% scholarships funded by inDrive. The system uses AI to analyze candidate essays, detect leadership potential, and provide transparent, explainable recommendations to the admissions committee.

> **AI does NOT make final decisions.** It is a transparent support tool — the final word always remains with the human committee.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Dashboard │ │  Candidates  │ │ Settings │ │ Student Form │   │
│  │(Charts)  │ │(AI Review)   │ │(Weights) │ │(Application) │   │
│  └────┬─────┘ └──────┬───────┘ └────┬─────┘ └──────┬───────┘   │
│       └───────────────┴──────────────┴──────────────┘           │
│                           REST API                               │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────┴──────────────────────────────────┐
│                      BACKEND (Express.js)                        │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    AI Pipeline                           │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │     │
│  │  │Essay Analyzer │  │ Achievement  │  │  Composite   │  │     │
│  │  │(Claude API)  │  │   Scorer     │  │   Scorer     │  │     │
│  │  │              │  │(Deterministic)│  │(Weighted Sum)│  │     │
│  │  │ 6 Dimensions │  │              │  │              │  │     │
│  │  │ AI Detection │  │ Olympiads    │  │ AI Scores    │  │     │
│  │  │ Evidence     │  │ Volunteering │  │ + Bonuses    │  │     │
│  │  │ Red Flags    │  │ Projects     │  │ = Final Score│  │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │     │
│  └─────────────────────────────────────────────────────────┘     │
│  ┌────────────┐  ┌───────────────┐  ┌────────────────────┐      │
│  │  multer    │  │  pdf-parse    │  │  Audit Log         │      │
│  │(PDF Upload)│  │(Text Extract) │  │(Transparency Trail)│      │
│  └────────────┘  └───────────────┘  └────────────────────┘      │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   PostgreSQL (Docker)  │
                    │  candidates, audit_log │
                    │  scoring_config        │
                    └───────────────────────┘
```

## AI Approach — 6-Dimension Essay Analysis

The system uses **Claude AI (Anthropic)** to analyze each candidate's motivation essay across 6 dimensions:

| Dimension | What It Measures | Why It Matters for InVision U |
|-----------|-----------------|-------------------------------|
| **Motivation** | Clarity of goals, passion, specific plans | Are goals authentic and actionable? |
| **Leadership** | Initiative, organizing others, influence | Can they lead change? |
| **Technical Potential** | Analytical thinking, problem-solving | Can they build solutions? |
| **Creativity** | Novel ideas, unconventional approaches | Do they think differently? |
| **Resilience / "Path Traveled"** | Overcoming obstacles, growth trajectory | **Core InVision U value** — finding hidden talent |
| **Social Impact** | Community orientation, desire to give back | Will they serve Kazakhstan? |

### Additional AI Capabilities
- **AI-Written Essay Detection**: Probability score (0-100%) identifying potentially AI-generated essays
- **Consistency Check**: Cross-references essay claims against stated achievements
- **Red Flag Detection**: Identifies contradictions or implausible claims
- **Evidence-Based Scoring**: Every score is backed by specific quotes from the essay

### Scoring Formula (Transparent)

```
Composite Score = (Weighted AI Dimension Average × 0.75) + Achievement Bonus + Rural Bonus

Where:
- AI Dimensions: Each scored 0-100, weighted by admin-configurable sliders
- Achievement Bonus: Deterministic points (olympiads: 8-20, volunteering: 10, projects: 10, awards: 8)
- Rural Bonus: Configurable bonus for candidates from underrepresented regions
```

## Fairness & Explainability

- **Human-in-the-Loop**: AI only recommends. Status changes require explicit admin action
- **Evidence Trail**: Every score links to specific essay quotes with explanations
- **Confidence Levels**: Each dimension shows HIGH/MED/LOW confidence
- **Anti-Bias Safeguards**: AI prompt explicitly forbids using gender, ethnicity, or socioeconomic status as negative factors
- **Rural Equity Bonus**: Transparent, adjustable bonus for rural candidates
- **Full Audit Trail**: Every admin action (status change, review) is logged
- **Configurable Weights**: Admissions committee controls dimension priorities via Settings

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Vite, Ant Design, Recharts |
| Backend | Express.js, TypeScript, Node.js |
| Database | PostgreSQL 16 (Docker) |
| AI | Claude API (Anthropic) — claude-haiku-4-5 model |
| File Upload | multer + pdf-parse for essay PDF processing |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/Mountygoi/InVision-U.git
cd InVision-U

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Start PostgreSQL

```bash
# From project root
docker compose up -d
```

### 3. Configure Environment

```bash
# In server directory
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY (optional — seed data has pre-computed AI results)
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

### 5. Open in Browser

- **Admin Dashboard**: http://localhost:5173/
- **Candidates Review**: http://localhost:5173/candidates
- **Scoring Settings**: http://localhost:5173/settings
- **Student Application**: http://localhost:5173/apply

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | List candidates (supports `?search=`, `?status=`, `?sort=`) |
| GET | `/api/candidates/:id` | Get candidate detail with full AI analysis |
| POST | `/api/apply` | Submit new application (multipart form with PDF) |
| POST | `/api/candidates/:id/analyze` | Re-trigger AI analysis |
| PATCH | `/api/candidates/:id/status` | Update candidate status |
| PATCH | `/api/candidates/:id/review` | Add reviewer notes |
| GET | `/api/stats` | Dashboard statistics and aggregations |
| GET | `/api/scoring-config` | Get current scoring weights |
| PUT | `/api/scoring-config` | Update weights (recalculates all scores) |
| GET | `/api/audit-log` | Transparency audit trail |
| GET | `/api/health` | Health check + AI availability status |

## Data & Privacy

- Candidate essays are only accessible in individual detail views, NOT in list endpoints
- PDF uploads are stored locally in `uploads/` (excluded from git)
- No PII in URL query parameters
- `.env` file with API keys excluded from version control
- All data stays on the server — no external data sharing beyond the Claude API call for essay analysis

## Known Limitations

- **Single LLM Provider**: Currently only supports Claude API. Scores may vary slightly between analysis runs due to LLM non-determinism
- **Language Support**: AI prompt handles Kazakh, Russian, and English essays, but analysis quality is best for English
- **No Plagiarism Detection**: System detects AI-generated text but does not check against an essay corpus
- **In-Memory PDF Processing**: Large PDFs may cause memory pressure on low-resource servers
- **No Authentication**: Admin panel currently has no login system (MVP scope)
- **Scale**: Designed for hundreds-to-thousands of candidates, not millions

## Project Structure

```
InVision-U/
├── docker-compose.yml          # PostgreSQL setup
├── README.md
├── client/                     # React frontend
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx   # Analytics & charts
│       │   ├── Candidates.tsx  # AI-powered review panel
│       │   ├── Settings.tsx    # Scoring weight configuration
│       │   └── StudentForm.tsx # Application form
│       ├── layout/AppHeader.tsx
│       └── types/index.ts      # Shared TypeScript types
└── server/                     # Express.js backend
    ├── index.ts                # Server entry point
    ├── db.ts                   # PostgreSQL connection
    ├── seed.ts                 # Demo data (10 candidates)
    ├── types.ts                # Server types
    ├── ai/
    │   ├── prompts.ts          # Claude AI system prompt
    │   ├── essayAnalyzer.ts    # LLM integration
    │   ├── achievementScorer.ts # Deterministic scoring
    │   └── compositeScorer.ts  # Weighted composite
    ├── routes/
    │   ├── candidates.ts       # CRUD + analysis
    │   ├── stats.ts            # Dashboard aggregations
    │   └── config.ts           # Scoring weights
    └── middleware/
        └── upload.ts           # PDF upload handling
```

## Team

Decentrathon 5.0 — AI inDrive Track
