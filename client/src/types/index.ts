export interface ScoringWeights {
  volunteering: number;
  olympiad: number;
  project: number;
  ruralBonus: number;
}

export interface Candidate {
  id: string;
  name: string;
  university?: string; // Добавили опционально
  region: string;
  city: string;        // Добавили для отображения в карточке
  country?: string;
  avatarUrl?: string;
  essayUrl?: string;
  isRural: boolean;
  experience: string[];
  skills: string[];
  // Добавляем 'interview' и 'declined', чтобы кнопки работали!
  status: 'new' | 'shortlisted' | 'interviewed' | 'accepted' | 'declined' | 'interview';
  aiScore?: number;
  // Добавляем компетенции для Radar Chart
  competencies?: {
    leadership: number;
    motivation: number;
    technicalPotential: number;
    creativity: number;
    empathy: number;
    socialImpact: number;
  };
}