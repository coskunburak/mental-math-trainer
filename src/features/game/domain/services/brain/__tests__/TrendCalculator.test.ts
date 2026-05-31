import type { BrainScore } from '@features/game/domain/entities/BrainScore';
import { BrainScoreCalculator } from '@features/game/domain/services/brain/BrainScoreCalculator';
import { TrendCalculator } from '@features/game/domain/services/brain/TrendCalculator';
import { Confidence } from '@features/game/domain/valueObjects/Confidence';
import { NormalizedMetric } from '@features/game/domain/valueObjects/NormalizedMetric';

describe('TrendCalculator', () => {
  it('computes 30-day change using last 7-day average vs previous 7-day average', () => {
    const calculator = new TrendCalculator(new BrainScoreCalculator());

    const dailyScores: BrainScore[] = [
      makeBrainScore('2026-01-01', 500, 0.5),
      makeBrainScore('2026-01-02', 500, 0.5),
      makeBrainScore('2026-01-03', 500, 0.5),
      makeBrainScore('2026-01-04', 500, 0.5),
      makeBrainScore('2026-01-05', 500, 0.5),
      makeBrainScore('2026-01-06', 500, 0.5),
      makeBrainScore('2026-01-07', 500, 0.5),
      makeBrainScore('2026-01-08', 550, 0.57),
      makeBrainScore('2026-01-09', 550, 0.57),
      makeBrainScore('2026-01-10', 550, 0.57),
      makeBrainScore('2026-01-11', 550, 0.57),
      makeBrainScore('2026-01-12', 550, 0.57),
      makeBrainScore('2026-01-13', 550, 0.57),
      makeBrainScore('2026-01-14', 550, 0.57),
    ];

    const trend = calculator.computeTrend({
      dailyScores,
      referenceDateKey: '2026-01-14',
    });

    expect(trend).not.toBeNull();
    if (!trend) {
      return;
    }

    expect(trend.overallDeltaPct).toBeCloseTo(10, 5);
    expect(trend.speedDeltaPct).toBeCloseTo(14, 5);
    expect(trend.overallDirection).toBe('up');
    expect(trend.speedDirection).toBe('faster');
  });
});

function makeBrainScore(
  dateKey: string,
  score: number,
  speed: number,
  confidence = 0.9,
): BrainScore {
  return {
    dateKey,
    window: {
      startedAt: `${dateKey}T10:00:00.000Z`,
      endedAt: `${dateKey}T10:05:00.000Z`,
      questionCount: 8,
    },
    score,
    normalizedScore: NormalizedMetric.from(score / 1000),
    components: {
      speed: NormalizedMetric.from(speed),
      accuracy: NormalizedMetric.from(0.8),
      hardPerf: NormalizedMetric.from(0.7),
    },
    confidence: Confidence.from(confidence),
    quality: {
      guessingPenalty: 0,
      spamPenalty: 0,
      penaltyMultiplier: 1,
      fastWrongRate: 0,
      spamTapRuns: 0,
    },
    coverage: {
      operationCoverage: 0.7,
      difficultyCoverage: 0.7,
      hardCoverage: 0.7,
    },
  };
}
