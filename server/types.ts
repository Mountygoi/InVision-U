// ============================================================
// InVision U - Server Types
// ============================================================

export interface Achievement {
  type: 'olympiad' | 'volunteering' | 'project' | 'award';
  title: string;
  description?: string;
  year?: number;
  level?: 'national' | 'regional' | 'city' | 'school';
}

export interface CompetencyScore {
  score: number;        // 0-100
  evidence: string;     // quote from essay
  confidence?: number;  // 0.0-1.0 (optional, from seed data)
}

export interface AIScores {
  motivation: CompetencyScore;
  leadership: CompetencyScore;
  technicalPotential: CompetencyScore;
  creativity: CompetencyScore;
  resilience: CompetencyScore;
  socialImpact: CompetencyScore;
}

export interface AIFlags {
  is_ai_generated: number;        // 0.0-1.0
  generic_content: boolean;
  high_potential_outlier: boolean;
  // Legacy fields from seed data
  aiWrittenProbability?: number;
  consistencyScore?: number;
  redFlags?: string[];
}

export interface AIAnalysisResult {
  scores: AIScores;
  flags: AIFlags;
  summary: string;
  modelVersion: string;
  analyzedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  university?: string;
  school?: string;
  city: string;
  region?: string;
  isRural: boolean;
  gpa?: number;
  yearOfStudy?: number;
  achievements: Achievement[];
  skills: string[];
  essayText?: string;
  essayFilePath?: string;
  aiScores?: AIScores;
  aiSummary?: string;
  aiFlags?: AIFlags;
  aiModelVersion?: string;
  aiAnalyzedAt?: string;
  compositeScore: number;
  achievementScore: number;
  status: 'new' | 'under_review' | 'interview' | 'accepted' | 'declined' | 'waitlisted';
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  contactMethod?: string;
  contactHandle?: string;
}

export interface ScoringWeights {
  motivation: number;
  leadership: number;
  technicalPotential: number;
  creativity: number;
  resilience: number;
  socialImpact: number;
  achievementBonus: number;
  ruralBonus: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  motivation: 20,
  leadership: 25,
  technicalPotential: 15,
  creativity: 10,
  resilience: 20,
  socialImpact: 10,
  achievementBonus: 15,
  ruralBonus: 10,
};

export interface DashboardStats {
  total: number;
  new: number;
  underReview: number;
  interview: number;
  accepted: number;
  declined: number;
  rural: number;
  avgCompositeScore: number;
  scoreDistribution: { bucket: string; count: number }[];
  regionBreakdown: { region: string; count: number; rural: number }[];
  statusFunnel: { status: string; count: number }[];
}
