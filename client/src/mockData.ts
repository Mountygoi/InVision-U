import type { Candidate } from './types';

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Aisha Kanatova',
    university: 'Korkyt Ata University',
    region: 'Qyzylorda',
    city: 'Qyzylorda',
    isRural: true,
    experience: ['volunteering', 'olympiad'],
    skills: ['Python', 'Leadership'],
    status: 'new',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
    essayUrl: '#',
    competencies: {
      leadership: 85,
      motivation: 90,
      technicalPotential: 70,
      creativity: 65,
      empathy: 95,
      socialImpact: 92
    }
  },
  {
    id: '2',
    name: 'Nurlan Saduakas',
    university: 'IITU',
    region: 'Almaty',
    city: 'Almaty',
    isRural: false,
    experience: ['project'],
    skills: ['React', 'TypeScript'],
    status: 'new',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nurlan',
    essayUrl: '#',
    competencies: {
      leadership: 60,
      motivation: 75,
      technicalPotential: 95,
      creativity: 80,
      empathy: 70,
      socialImpact: 50
    }
  },
  {
    id: '3',
    name: 'Daniyar Bekov',
    university: 'Atyrau Oil and Gas University',
    region: 'Atyrau',
    city: 'Atyrau',
    isRural: true,
    experience: ['olympiad', 'project'],
    skills: ['Math', 'Python'],
    status: 'new',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniyar',
    essayUrl: '#',
    competencies: {
      leadership: 75,
      motivation: 80,
      technicalPotential: 85,
      creativity: 60,
      empathy: 75,
      socialImpact: 80
    }
  }
];