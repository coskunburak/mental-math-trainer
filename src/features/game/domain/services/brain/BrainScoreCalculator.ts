import type { AnswerEvent, OperationType } from '@features/game/domain/entities/AnswerEvent';
import type { BrainScore } from '@features/game/domain/entities/BrainScore';
import type { BrainPowerConfig } from '@features/game/domain/services/brain/BrainPowerConfig';
import { DEFAULT_BRAIN_POWER_CONFIG } from '@features/game/domain/services/brain/BrainPowerConfig';
import {
  baselineMsForEvent,
  clamp01,
  difficultyWeight,
  sanitizeAnswerEvents,
  toDateKey,
  trimmedMean,
  weightedTrimmedMean,
  winsorize,
} from '@features/game/domain/services/brain/brainMath';
import { Confidence } from '@features/game/domain/valueObjects/Confidence';
import { NormalizedMetric } from '@features/game/domain/valueObjects/NormalizedMetric';

interface CellAccumulator {
  operationType: OperationType;
  difficultyTier: number;
  total: number;
  correct: number;
  correctPairs: Array<{
    responseMs: number;
    baselineMs: number;
  }>;
}

export interface CellPerformance {
  operationType: OperationType;
  difficultyTier: number;
  sampleSize: number;
  correctCount: number;
  accuracy: number;
  speed: number;
}

export interface BrainScoreCalculationInput {
  events: readonly AnswerEvent[];
  dateKey?: string;
}

export class BrainScoreCalculator {
  constructor(private readonly config: BrainPowerConfig = DEFAULT_BRAIN_POWER_CONFIG) {}

  calculate(input: BrainScoreCalculationInput): BrainScore {
    const events = sanitizeAnswerEvents(input.events, this.config);
    const dateKey = this.resolveDateKey(events, input.dateKey);

    if (events.length === 0) {
      return {
        dateKey,
        window: {
          startedAt: `${dateKey}T00:00:00.000Z`,
          endedAt: `${dateKey}T00:00:00.000Z`,
          questionCount: 0,
        },
        score: 0,
        normalizedScore: NormalizedMetric.from(0),
        components: {
          speed: NormalizedMetric.from(0),
          accuracy: NormalizedMetric.from(0),
          hardPerf: NormalizedMetric.from(0),
        },
        confidence: Confidence.from(0),
        quality: {
          guessingPenalty: 0,
          spamPenalty: 0,
          penaltyMultiplier: 1,
          fastWrongRate: 0,
          spamTapRuns: 0,
        },
        coverage: {
          operationCoverage: 0,
          difficultyCoverage: 0,
          hardCoverage: 0,
        },
      };
    }

    const cellPerformance = this.buildCellPerformance(events);
    const speedComponent = this.computeSpeedComponent(cellPerformance);
    const accuracyComponent = this.computeAccuracyComponent(cellPerformance);
    const hardPerformance = this.computeHardPerformance(cellPerformance);

    const quality = this.computeAntiGamingQuality(events);

    const weightedTotal =
      this.config.componentWeights.speed * speedComponent
      + this.config.componentWeights.accuracy * accuracyComponent
      + this.config.componentWeights.hardPerf * hardPerformance;

    const normalizedScore = NormalizedMetric.from(weightedTotal * quality.penaltyMultiplier);
    const finalScore = Math.round(normalizedScore.value * this.config.scaleMax);

    const coverage = this.computeCoverage(events, cellPerformance);
    const confidence = this.computeConfidence(events.length, coverage);

    return {
      dateKey,
      window: {
        startedAt: new Date(events[0].occurredAtMs).toISOString(),
        endedAt: new Date(events[events.length - 1].occurredAtMs).toISOString(),
        questionCount: events.length,
      },
      score: finalScore,
      normalizedScore,
      components: {
        speed: NormalizedMetric.from(speedComponent),
        accuracy: NormalizedMetric.from(accuracyComponent),
        hardPerf: NormalizedMetric.from(hardPerformance),
      },
      confidence,
      quality,
      coverage,
    };
  }

  buildCellPerformance(events: readonly AnswerEvent[]): CellPerformance[] {
    const sanitized = sanitizeAnswerEvents(events, this.config);
    return this.buildCellPerformanceFromSanitized(sanitized);
  }

  private resolveDateKey(
    events: ReturnType<typeof sanitizeAnswerEvents>,
    explicitDateKey?: string,
  ): string {
    if (explicitDateKey) {
      return explicitDateKey;
    }

    if (events.length === 0) {
      return '1970-01-01';
    }

    return toDateKey(events[events.length - 1].occurredAt);
  }

  private buildCellPerformanceFromSanitized(
    events: ReturnType<typeof sanitizeAnswerEvents>,
  ): CellPerformance[] {
    const cells = new Map<string, CellAccumulator>();

    for (const event of events) {
      const key = `${event.operationType}|${event.difficultyTier}`;
      const current = cells.get(key);
      if (!current) {
        cells.set(key, {
          operationType: event.operationType,
          difficultyTier: event.difficultyTier,
          total: 1,
          correct: event.isCorrect ? 1 : 0,
          correctPairs: event.isCorrect
            ? [{ responseMs: event.responseTimeMs, baselineMs: baselineMsForEvent(event, this.config) }]
            : [],
        });
        continue;
      }

      current.total += 1;
      if (event.isCorrect) {
        current.correct += 1;
        current.correctPairs.push({
          responseMs: event.responseTimeMs,
          baselineMs: baselineMsForEvent(event, this.config),
        });
      }
    }

    const lower = this.config.normalization.winsorLowerPercentile;
    const upper = this.config.normalization.winsorUpperPercentile;
    const trim = this.config.normalization.trimmedMeanRatio;

    const cellPerformance: CellPerformance[] = [];

    for (const cell of cells.values()) {
      const accuracy = (cell.correct + 1) / (cell.total + 2);
      const responseTimes = cell.correctPairs.map((pair) => pair.responseMs);
      const winsorizedTimes = winsorize(responseTimes, lower, upper);

      const normalizedSpeeds = winsorizedTimes.map((responseMs, index) => {
        const baselineMs = cell.correctPairs[index]?.baselineMs ?? responseMs;
        return this.normalizedSpeed(responseMs, baselineMs);
      });

      const speed = cell.correct === 0 ? 0 : clamp01(trimmedMean(normalizedSpeeds, trim));

      cellPerformance.push({
        operationType: cell.operationType,
        difficultyTier: cell.difficultyTier,
        sampleSize: cell.total,
        correctCount: cell.correct,
        accuracy,
        speed,
      });
    }

    return cellPerformance;
  }

  private normalizedSpeed(responseMs: number, baselineMs: number): number {
    const scale = this.config.normalization.sigmoidScaleMs;
    return clamp01(1 / (1 + Math.exp((responseMs - baselineMs) / scale)));
  }

  private computeSpeedComponent(cellPerformance: readonly CellPerformance[]): number {
    const weighted = cellPerformance
      .filter((cell) => cell.correctCount > 0)
      .map((cell) => ({
        value: cell.speed,
        weight:
          difficultyWeight(cell.difficultyTier, this.config)
          * Math.min(1, Math.sqrt(cell.correctCount) / 2),
      }));

    return clamp01(weightedTrimmedMean(weighted, this.config.normalization.trimmedMeanRatio));
  }

  private computeAccuracyComponent(cellPerformance: readonly CellPerformance[]): number {
    const weighted = cellPerformance.map((cell) => ({
      value: cell.accuracy,
      weight:
        difficultyWeight(cell.difficultyTier, this.config)
        * Math.min(1, Math.sqrt(cell.sampleSize) / 2),
    }));

    return clamp01(weightedTrimmedMean(weighted, this.config.normalization.trimmedMeanRatio));
  }

  private computeHardPerformance(cellPerformance: readonly CellPerformance[]): number {
    if (cellPerformance.length === 0) {
      return 0;
    }

    const hardestTier = Math.max(...cellPerformance.map((cell) => cell.difficultyTier));
    const hardThreshold = Math.max(
      this.config.hardPerformance.minHardTier,
      Math.ceil(hardestTier * this.config.hardPerformance.hardTierFraction),
    );

    const hardCells = cellPerformance.filter((cell) => cell.difficultyTier >= hardThreshold);

    if (hardCells.length === 0) {
      const fallbackAccuracy = this.computeAccuracyComponent(cellPerformance);
      return Math.min(0.5, fallbackAccuracy * 0.8);
    }

    const weighted = hardCells.map((cell) => ({
      value:
        this.config.hardPerformance.accuracyWeight * cell.accuracy
        + this.config.hardPerformance.speedWeight * cell.speed,
      weight:
        difficultyWeight(cell.difficultyTier, this.config)
        * Math.min(1, Math.sqrt(cell.sampleSize) / 2),
    }));

    return clamp01(weightedTrimmedMean(weighted, this.config.normalization.trimmedMeanRatio));
  }

  private computeAntiGamingQuality(events: ReturnType<typeof sanitizeAnswerEvents>): {
    guessingPenalty: number;
    spamPenalty: number;
    penaltyMultiplier: number;
    fastWrongRate: number;
    spamTapRuns: number;
  } {
    const fastThreshold = this.config.antiGaming.guessFastThresholdMs;
    const fastEvents = events.filter((event) => event.responseTimeMs <= fastThreshold);
    const fastWrongCount = fastEvents.filter((event) => !event.isCorrect).length;
    const fastWrongRate = fastEvents.length === 0 ? 0 : fastWrongCount / fastEvents.length;

    const excessWrongRate = Math.max(0, fastWrongRate - this.config.antiGaming.allowedFastWrongRate);
    const normalizedExcess = excessWrongRate / Math.max(1e-9, 1 - this.config.antiGaming.allowedFastWrongRate);
    const fastEvidence = Math.min(1, fastEvents.length / 10);

    const guessingPenalty = clamp01(
      normalizedExcess * this.config.antiGaming.maxGuessingPenalty * fastEvidence,
    );

    const spamTapRuns = this.countSpamTapRuns(events);
    const spamPenalty = clamp01(
      Math.min(
        this.config.antiGaming.maxSpamPenalty,
        spamTapRuns * this.config.antiGaming.spamTapPenaltyPerRun,
      ),
    );

    const penaltyMultiplier = clamp01(1 - guessingPenalty - spamPenalty);

    return {
      guessingPenalty,
      spamPenalty,
      penaltyMultiplier,
      fastWrongRate,
      spamTapRuns,
    };
  }

  private countSpamTapRuns(events: ReturnType<typeof sanitizeAnswerEvents>): number {
    const threshold = this.config.antiGaming.spamTapThresholdMs;
    const minRunLength = this.config.antiGaming.spamTapRunLength;

    let runLength = 0;
    let runs = 0;

    for (const event of events) {
      if (event.responseTimeMs < threshold) {
        runLength += 1;
        continue;
      }

      if (runLength >= minRunLength) {
        runs += 1;
      }
      runLength = 0;
    }

    if (runLength >= minRunLength) {
      runs += 1;
    }

    return runs;
  }

  private computeCoverage(
    events: ReturnType<typeof sanitizeAnswerEvents>,
    cellPerformance: readonly CellPerformance[],
  ): {
    operationCoverage: number;
    difficultyCoverage: number;
    hardCoverage: number;
  } {
    const operationCount = new Set(events.map((event) => event.operationType)).size;
    const difficultyCount = new Set(events.map((event) => event.difficultyTier)).size;
    const hardestTier = Math.max(...events.map((event) => event.difficultyTier));
    const hardTierThreshold = Math.max(
      this.config.hardPerformance.minHardTier,
      Math.ceil(hardestTier * this.config.hardPerformance.hardTierFraction),
    );

    const hardEvents = events.filter((event) => event.difficultyTier >= hardTierThreshold);

    const operationCoverage = clamp01(operationCount / this.config.confidence.expectedOperationTypes);
    const difficultyCoverage = clamp01(difficultyCount / this.config.confidence.expectedDifficultyTiers);
    const hardCoverage = clamp01(hardEvents.length / Math.max(1, Math.round(events.length * 0.3)));

    if (cellPerformance.length === 0) {
      return {
        operationCoverage: 0,
        difficultyCoverage: 0,
        hardCoverage: 0,
      };
    }

    return {
      operationCoverage,
      difficultyCoverage,
      hardCoverage,
    };
  }

  private computeConfidence(
    sampleSize: number,
    coverage: {
      operationCoverage: number;
      difficultyCoverage: number;
      hardCoverage: number;
    },
  ): Confidence {
    const sampleConfidence = 1 - Math.exp(-sampleSize / this.config.confidence.sampleSizePivot);

    const confidence = clamp01(
      sampleConfidence * this.config.confidence.sampleWeight
      + coverage.operationCoverage * this.config.confidence.operationCoverageWeight
      + coverage.difficultyCoverage * this.config.confidence.difficultyCoverageWeight
      + coverage.hardCoverage * this.config.confidence.hardCoverageWeight,
    );

    return Confidence.from(confidence);
  }
}
