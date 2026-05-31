import type { OperationType } from '@features/game/domain/entities/AnswerEvent';

export interface BrainPowerConfig {
  scaleMax: number;
  componentWeights: {
    speed: number;
    accuracy: number;
    hardPerf: number;
  };
  minQuestionsPerDailyScore: number;
  normalization: {
    responseTimeFloorMs: number;
    winsorLowerPercentile: number;
    winsorUpperPercentile: number;
    trimmedMeanRatio: number;
    sigmoidScaleMs: number;
    baselineMsByOperation: Record<OperationType, number>;
    difficultyTierMultiplier: number;
    stepCountMultiplier: number;
    difficultyWeightSlope: number;
  };
  antiGaming: {
    guessFastThresholdMs: number;
    allowedFastWrongRate: number;
    maxGuessingPenalty: number;
    spamTapThresholdMs: number;
    spamTapRunLength: number;
    spamTapPenaltyPerRun: number;
    maxSpamPenalty: number;
  };
  hardPerformance: {
    hardTierFraction: number;
    minHardTier: number;
    accuracyWeight: number;
    speedWeight: number;
  };
  confidence: {
    sampleSizePivot: number;
    expectedOperationTypes: number;
    expectedDifficultyTiers: number;
    sampleWeight: number;
    operationCoverageWeight: number;
    difficultyCoverageWeight: number;
    hardCoverageWeight: number;
    lowConfidenceThreshold: number;
  };
  trend: {
    recentWindowDays: number;
    previousWindowDays: number;
    minDaysPerWindow: number;
    stableDeltaThresholdPct: number;
  };
  weakness: {
    minCellSamples: number;
    topWeakAreaCount: number;
    zScoreEpsilon: number;
    recommendationCount: number;
    weakZThreshold: number;
  };
}

export const DEFAULT_BRAIN_POWER_CONFIG: BrainPowerConfig = {
  scaleMax: 1000,
  componentWeights: {
    speed: 0.4,
    accuracy: 0.35,
    hardPerf: 0.25,
  },
  minQuestionsPerDailyScore: 5,
  normalization: {
    responseTimeFloorMs: 250,
    winsorLowerPercentile: 0.05,
    winsorUpperPercentile: 0.95,
    trimmedMeanRatio: 0.1,
    sigmoidScaleMs: 450,
    baselineMsByOperation: {
      add: 1700,
      sub: 1900,
      mul: 2400,
      div: 2700,
      mixed: 2300,
      sequence: 3100,
      missingNumber: 2800,
    },
    difficultyTierMultiplier: 0.16,
    stepCountMultiplier: 0.08,
    difficultyWeightSlope: 0.12,
  },
  antiGaming: {
    guessFastThresholdMs: 700,
    allowedFastWrongRate: 0.3,
    maxGuessingPenalty: 0.35,
    spamTapThresholdMs: 420,
    spamTapRunLength: 3,
    spamTapPenaltyPerRun: 0.05,
    maxSpamPenalty: 0.2,
  },
  hardPerformance: {
    hardTierFraction: 0.7,
    minHardTier: 3,
    accuracyWeight: 0.65,
    speedWeight: 0.35,
  },
  confidence: {
    sampleSizePivot: 120,
    expectedOperationTypes: 7,
    expectedDifficultyTiers: 8,
    sampleWeight: 0.5,
    operationCoverageWeight: 0.2,
    difficultyCoverageWeight: 0.2,
    hardCoverageWeight: 0.1,
    lowConfidenceThreshold: 0.6,
  },
  trend: {
    recentWindowDays: 7,
    previousWindowDays: 7,
    minDaysPerWindow: 3,
    stableDeltaThresholdPct: 3,
  },
  weakness: {
    minCellSamples: 6,
    topWeakAreaCount: 3,
    zScoreEpsilon: 1e-6,
    recommendationCount: 3,
    weakZThreshold: 0.5,
  },
};
