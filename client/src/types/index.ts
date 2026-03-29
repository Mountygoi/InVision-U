export interface CompetencyScore {
  score: number;
  evidence: string;
  confidence?: number;
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
  is_ai_generated: number;
  generic_content: boolean;
  high_potential_outlier: boolean;
  // Legacy from seed data
  aiWrittenProbability?: number;
  consistencyScore?: number;
  redFlags?: string[];
}

export interface Achievement {
  type: 'olympiad' | 'volunteering' | 'project' | 'award';
  title: string;
  description?: string;
  year?: number;
  level?: 'national' | 'regional' | 'city' | 'school';
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

export interface Candidate {
  id: string;
  name: string;
  avatarUrl?: string; // <--- ОБЯЗАТЕЛЬНО
  email?: string;
  phone?: string;
  university?: string;
  city: string;
  region?: string;
  isRural: boolean;
  gpa?: number;
  yearOfStudy?: number;
  achievements: Achievement[];
  skills: string[];
  essayText?: string;
  aiScores?: AIScores;
  aiSummary?: string;
  aiFlags?: AIFlags;
  aiModelVersion?: string;
  aiAnalyzedAt?: string;
  compositeScore: number;
  achievementScore: number;
  status: 'new' | 'under_review' | 'interview' | 'accepted' | 'declined' | 'waitlisted'| 'arbitration';
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

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
  recentApplications: {
    id: string;
    name: string;
    city: string;
    university: string;
    status: string;
    compositeScore: number;
    createdAt: string;
  }[];
}
