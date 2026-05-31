import type { Confidence } from '@features/game/domain/valueObjects/Confidence';
import type { NormalizedMetric } from '@features/game/domain/valueObjects/NormalizedMetric';

export interface BrainScoreComponents {
  speed: NormalizedMetric;
  accuracy: NormalizedMetric;
  hardPerf: NormalizedMetric;
}

export interface BrainScoreQuality {
  guessingPenalty: number;
  spamPenalty: number;
  penaltyMultiplier: number;
  fastWrongRate: number;
  spamTapRuns: number;
}

export interface BrainScoreCoverage {
  operationCoverage: number;
  difficultyCoverage: number;
  hardCoverage: number;
}

export interface BrainScore {
  dateKey: string;
  window: {
    startedAt: string;
    endedAt: string;
    questionCount: number;
  };
  score: number;
  normalizedScore: NormalizedMetric;
  components: BrainScoreComponents;
  confidence: Confidence;
  quality: BrainScoreQuality;
  coverage: BrainScoreCoverage;
}
