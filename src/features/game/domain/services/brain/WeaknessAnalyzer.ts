import type { AnswerEvent } from '@features/game/domain/entities/AnswerEvent';
import type { WeakArea, WeakAreaReason, WeaknessReport } from '@features/game/domain/entities/WeakArea';
import type { BrainPowerConfig } from '@features/game/domain/services/brain/BrainPowerConfig';
import { DEFAULT_BRAIN_POWER_CONFIG } from '@features/game/domain/services/brain/BrainPowerConfig';
import { BrainScoreCalculator, type CellPerformance } from '@features/game/domain/services/brain/BrainScoreCalculator';
import { robustWeakZ, toPercentile } from '@features/game/domain/services/brain/brainMath';

interface ScoredWeakCell {
  cell: CellPerformance;
  reason: WeakAreaReason;
  accuracyWeakZ: number;
  speedWeakZ: number;
  weaknessScore: number;
}

export class WeaknessAnalyzer {
  constructor(
    private readonly scoreCalculator: BrainScoreCalculator,
    private readonly config: BrainPowerConfig = DEFAULT_BRAIN_POWER_CONFIG,
  ) {}

  analyze(events: readonly AnswerEvent[]): WeaknessReport {
    const cells = this.scoreCalculator
      .buildCellPerformance(events)
      .filter((cell) => cell.sampleSize >= this.config.weakness.minCellSamples);

    if (cells.length === 0) {
      return {
        topWeakAreas: [],
        recommendations: this.defaultRecommendations(),
      };
    }

    const accuracyPopulation = cells.map((cell) => cell.accuracy);
    const speedPopulation = cells.map((cell) => cell.speed);

    const scoredCells: ScoredWeakCell[] = cells
      .map((cell) => {
        const accuracyWeakZ = Math.max(
          0,
          -robustWeakZ(cell.accuracy, accuracyPopulation, this.config.weakness.zScoreEpsilon),
        );
        const speedWeakZ = Math.max(
          0,
          -robustWeakZ(cell.speed, speedPopulation, this.config.weakness.zScoreEpsilon),
        );
        const weaknessScore = 0.6 * accuracyWeakZ + 0.4 * speedWeakZ;
        const reason = this.classifyReason(accuracyWeakZ, speedWeakZ);

        return {
          cell,
          reason,
          accuracyWeakZ,
          speedWeakZ,
          weaknessScore,
        };
      })
      .filter((item) => item.weaknessScore > 0)
      .sort((left, right) => right.weaknessScore - left.weaknessScore);

    if (scoredCells.length === 0) {
      return {
        topWeakAreas: [],
        recommendations: this.defaultRecommendations(),
      };
    }

    const weaknessScores = scoredCells.map((item) => item.weaknessScore);
    const top = scoredCells.slice(0, this.config.weakness.topWeakAreaCount);

    const topWeakAreas: WeakArea[] = top.map((item) => ({
      operationType: item.cell.operationType,
      difficultyTierRange: [item.cell.difficultyTier, item.cell.difficultyTier],
      reason: item.reason,
      evidence: {
        sampleSize: item.cell.sampleSize,
        accuracy: item.cell.accuracy,
        speed: item.cell.speed,
        accuracyWeakZ: item.accuracyWeakZ,
        speedWeakZ: item.speedWeakZ,
        weaknessScore: item.weaknessScore,
        weaknessPercentile: toPercentile(weaknessScores, item.weaknessScore),
      },
    }));

    return {
      topWeakAreas,
      recommendations: this.buildRecommendations(topWeakAreas),
    };
  }

  private classifyReason(accuracyWeakZ: number, speedWeakZ: number): WeakAreaReason {
    const threshold = this.config.weakness.weakZThreshold;
    const inaccurate = accuracyWeakZ >= threshold;
    const slow = speedWeakZ >= threshold;

    if (inaccurate && slow) {
      return 'both';
    }

    if (inaccurate) {
      return 'inaccurate';
    }

    if (slow) {
      return 'slow';
    }

    return accuracyWeakZ >= speedWeakZ ? 'inaccurate' : 'slow';
  }

  private buildRecommendations(topWeakAreas: readonly WeakArea[]): string[] {
    const recommendations = topWeakAreas.map((area) => {
      const tierText = formatTierRange(area.difficultyTierRange);
      const operation = area.operationType;

      if (area.reason === 'slow') {
        return `Timed ladder: 3 rounds of 8 ${operation} questions at tier ${tierText}; keep accuracy above 85% while reducing average response by 10%.`;
      }

      if (area.reason === 'inaccurate') {
        return `Accuracy block: 20 ${operation} questions at tier ${tierText} in untimed mode; target at least 92% correct before adding time pressure.`;
      }

      return `Two-pass drill: first solve 12 ${operation} questions at tier ${tierText} untimed, then repeat 12 timed; compare mistakes and speed after each pass.`;
    });

    const fallback = this.defaultRecommendations();

    while (recommendations.length < this.config.weakness.recommendationCount) {
      recommendations.push(fallback[recommendations.length % fallback.length]);
    }

    return recommendations.slice(0, this.config.weakness.recommendationCount);
  }

  private defaultRecommendations(): string[] {
    return [
      'Daily mixed set: 15 questions with a focus on keeping accuracy above 90% before increasing pace.',
      'Speed control set: 3 blocks of 10 questions, each block 5% faster than the previous one while preserving correctness.',
      'Hard-tier repetition: repeat one hard tier for 12 questions and review every error pattern before starting the next block.',
    ];
  }
}

function formatTierRange(range: [number, number]): string {
  if (range[0] === range[1]) {
    return String(range[0]);
  }

  return `${range[0]}-${range[1]}`;
}
