import type { Confidence } from '@features/game/domain/valueObjects/Confidence';

export type TrendDirection = 'up' | 'down' | 'stable';
export type SpeedDirection = 'faster' | 'slower' | 'stable';

export interface TrendWindowSummary {
  startDateKey: string;
  endDateKey: string;
  daysWithScore: number;
  averageScore: number;
  averageSpeed: number;
  averageConfidence: number;
}

export interface BrainTrend {
  basis: 'last_7_vs_prev_7';
  recent: TrendWindowSummary;
  previous: TrendWindowSummary;
  overallDeltaPct: number;
  speedDeltaPct: number;
  confidence: Confidence;
  overallDirection: TrendDirection;
  speedDirection: SpeedDirection;
}
