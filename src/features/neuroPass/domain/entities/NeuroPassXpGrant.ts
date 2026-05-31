import type { NeuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';

export type NeuroPassRunGrade = 'C' | 'B' | 'A' | 'S';
export type NeuroPassCapState = 'none' | 'soft' | 'hard';

export interface NeuroPassXpGrantMeta {
  grade?: NeuroPassRunGrade;
  softCapped?: boolean;
  hardCapped?: boolean;
  runAccuracy?: number;
  rhythmBonus?: number;
  comboBonus?: number;
  phaseDiversityBonus?: number;
  antiSpamPenalty?: number;
  capState?: NeuroPassCapState;
  dayKeyUtc?: string;
  questId?: string;
}

export interface NeuroPassXpGrant {
  id: string;
  source: NeuroPassXpSource;
  amount: number;
  createdAtUtc: string;
  meta?: NeuroPassXpGrantMeta;
}
