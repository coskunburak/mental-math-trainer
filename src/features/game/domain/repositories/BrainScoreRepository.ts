import type { BrainScore } from '@features/game/domain/entities/BrainScore';

export interface BrainScoreRepository {
  saveDaily(score: BrainScore): Promise<void>;
  saveDailyMany(scores: readonly BrainScore[]): Promise<void>;
  getDaily(dateKey: string): Promise<BrainScore | null>;
  listBetween(startDateKey: string, endDateKey: string): Promise<BrainScore[]>;
}
