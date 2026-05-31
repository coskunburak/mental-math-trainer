import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export interface NeuroPassSeason {
  id: string;
  name: string;
  startAtUtc: Date;
  endAtUtc: Date;
  graceEndAtUtc: Date;
  tiersTotal: number;
  xpPerTier: number;
  state: NeuroPassSeasonState;
}
