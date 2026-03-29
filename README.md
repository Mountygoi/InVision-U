# InVision U - AI-Powered Candidate Selection System

> Hackathon: Decentrathon 5.0 | Track: AI inDrive | Team: BLUE NODE

## Problem

InVision University in Kazakhstan receives thousands of scholarship applications annually. Manual review of motivation essays is:
- **Time-consuming**: Each essay requires 15-20 minutes of expert review
- **Inconsistent**: Different reviewers apply different standards
- **Biased**: Unconscious bias against candidates from rural regions
- **Opaque**: Candidates don't understand why they were rejected

## Solution

An AI-powered candidate evaluation system that:

1. **Analyzes motivation essays** across 6 dimensions using Google Gemini AI
2. **Detects AI-generated content** with probability scoring
3. **Provides explainable scores** with evidence quotes from essays
4. **Prioritizes equity**: Rural candidates receive appropriate consideration
5. **Supports human-in-the-loop**: AI recommends, humans decide

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Express.js API   │────▶│  PostgreSQL 16  │
│   (Ant Design)  │◀────│  (TypeScript)     │◀────│  (Docker)       │
└─────────────────┘     └────────┬───────────┘     └─────────────────┘
                                 │
                        ┌────────▼───────────┐
                        │  Google Gemini AI   │
                        │  (gemini-2.5-flash) │
                        └────────────────────┘
```

### Composite Score Formula

```
composite = (weighted_ai_average * 0.75) + achievement_bonus + rural_bonus
```

## Key Features

### For Admissions Committee (`/admin`)
- **Dashboard**: Real-time statistics, score distribution, regional breakdown
- **Candidate Profiles**: Radar charts, AI flags, evidence quotes, confidence badges
- **Interview Scheduler**: Plan and manage interview slots
- **Configurable Weights**: Adjust scoring formula via Settings

### For Applicants
- **Application Form** (`/apply`): Submit essays (text or PDF), achievements, skills
- **Status Tracking** (`/status`): Check application progress
- **Multi-language**: Supports Kazakh, Russian, and English essays

### AI Analysis
- **6-Dimension Scoring**: Motivation, Leadership, Technical Potential, Creativity, Resilience, Social Impact
- **AI-Written Detection**: Probability score for machine-generated content
- **Generic Content Flag**: Identifies essays written with empty words
- **High-Potential Outlier**: Flags exceptional candidates from disadvantaged backgrounds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Ant Design 5 |
| Backend | Express.js, TypeScript, ESM modules |
| Database | PostgreSQL 16 (Docker) |
| AI | Google Gemini 2.5 Flash (free tier) |
| Charts | Recharts (radar, bar, funnel) |
| File Upload | Multer (PDF/TXT/DOC support) |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Google Gemini API key (free at [ai.google.dev](https://ai.google.dev))

### Setup

```bash
# 1. Clone
git clone https://github.com/Mountygoi/InVision-U.git
cd InVision-U

# 2. Start PostgreSQL
docker compose up -d

# 3. Setup server
cd server
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev

# 4. Setup client (new terminal)
cd client
npm install
npm run dev
```

### Access

- **Application Form**: http://localhost:5173/apply
- **Application Status**: http://localhost:5173/status
- **Admin Dashboard**: http://localhost:5173/admin
- **Candidate Review**: http://localhost:5173/admin/candidates
- **Interview Scheduler**: http://localhost:5173/admin/scheduler
- **Settings**: http://localhost:5173/admin/settings

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/candidates | List all candidates |
| GET | /api/candidates/:id | Get candidate details |
| POST | /api/candidates/apply | Submit new application |
| POST | /api/candidates/:id/analyze | Trigger AI analysis |
| PATCH | /api/candidates/:id/status | Update candidate status |
| GET | /api/stats | Dashboard statistics |
| GET | /api/scoring-config | Get scoring weights |
| PUT | /api/scoring-config | Update scoring weights |

## Design Principles

1. **Human-in-the-Loop**: AI provides recommendations, humans make final decisions
2. **Explainable AI**: Every score backed by evidence quotes from essays
3. **Equity-First**: Rural/disadvantaged candidates evaluated in context of their environment
4. **Transparency**: Scoring formula and weights are visible and configurable
5. **Bias Mitigation**: AI prompted to evaluate "distance traveled", not just current achievement

## Team

**BLUE NODE** - Decentrathon 5.0, AI inDrive Track

## License

MIT
