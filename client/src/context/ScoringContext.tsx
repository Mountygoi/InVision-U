import { createContext, useState, useContext, type ReactNode } from 'react';
import type { ScoringWeights } from '../types';

interface ScoringContextType {
  weights: ScoringWeights;
  setWeights: (newWeights: ScoringWeights) => void;
}

const defaultWeights: ScoringWeights = {
  volunteering: 15,
  olympiad: 20,
  project: 15,
  ruralBonus: 25,
};

const ScoringContext = createContext<ScoringContextType | undefined>(undefined);

export const ScoringProvider = ({ children }: { children: ReactNode }) => {
  const [weights, setWeights] = useState<ScoringWeights>(defaultWeights);

  return (
    <ScoringContext.Provider value={{ weights, setWeights }}>
      {children}
    </ScoringContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useScoring = () => {
  const context = useContext(ScoringContext);
  if (!context) throw new Error('useScoring must be used within a ScoringProvider');
  return context;
};