import type { AnswerEvent } from '@features/game/domain/entities/AnswerEvent';
import type { BrainScore } from '@features/game/domain/entities/BrainScore';
import type { BrainTrend, SpeedDirection, TrendDirection, TrendWindowSummary } from '@features/game/domain/entities/BrainTrend';
import type { BrainPowerConfig } from '@features/game/domain/services/brain/BrainPowerConfig';
import { DEFAULT_BRAIN_POWER_CONFIG } from '@features/game/domain/services/brain/BrainPowerConfig';
import { BrainScoreCalculator } from '@features/game/domain/services/brain/BrainScoreCalculator';
import { addDays, clamp01, compareDateKey, relativeDeltaPct, toDateKey } from '@features/game/domain/services/brain/brainMath';
import { Confidence } from '@features/game/domain/valueObjects/Confidence';

export interface ComputeTrendInput {
  dailyScores: readonly BrainScore[];
  referenceDateKey?: string;
}

export class TrendCalculator {
  constructor(
    private readonly scoreCalculator: BrainScoreCalculator,
    private readonly config: BrainPowerConfig = DEFAULT_BRAIN_POWER_CONFIG,
  ) {}

  computeDailyScores(events: readonly AnswerEvent[]): BrainScore[] {
    const grouped = new Map<string, AnswerEvent[]>();

    for (const event of events) {
      const key = toDateKey(event.occurredAt);
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, [event]);
        continue;
      }
      current.push(event);
    }

    const dailyScores: BrainScore[] = [];
    for (const [dateKey, dayEvents] of grouped.entries()) {
      if (dayEvents.length < this.config.minQuestionsPerDailyScore) {
        continue;
      }

      dailyScores.push(
        this.scoreCalculator.calculate({
          events: dayEvents,
          dateKey,
        }),
      );
    }

    return dailyScores.sort((left, right) => compareDateKey(left.dateKey, right.dateKey));
  }

  computeTrend(input: ComputeTrendInput): BrainTrend | null {
    if (input.dailyScores.length === 0) {
      return null;
    }

    const sorted = [...input.dailyScores].sort((left, right) => compareDateKey(left.dateKey, right.dateKey));

    const referenceDateKey = input.referenceDateKey ?? sorted[sorted.length - 1].dateKey;
    const recentEnd = referenceDateKey;
    const recentStart = addDays(recentEnd, -(this.config.trend.recentWindowDays - 1));
    const previousEnd = addDays(recentStart, -1);
    const previousStart = addDays(previousEnd, -(this.config.trend.previousWindowDays - 1));

    const recentScores = sorted.filter(
      (score) => compareDateKey(score.dateKey, recentStart) >= 0 && compareDateKey(score.dateKey, recentEnd) <= 0,
    );
    const previousScores = sorted.filter(
      (score) => compareDateKey(score.dateKey, previousStart) >= 0 && compareDateKey(score.dateKey, previousEnd) <= 0,
    );

    if (
      recentScores.length < this.config.trend.minDaysPerWindow
      || previousScores.length < this.config.trend.minDaysPerWindow
    ) {
      return null;
    }

    const recentSummary = this.summarizeWindow(recentScores, recentStart, recentEnd);
    const previousSummary = this.summarizeWindow(previousScores, previousStart, previousEnd);

    const overallDeltaPct = relativeDeltaPct(recentSummary.averageScore, previousSummary.averageScore);
    const speedDeltaPct = relativeDeltaPct(recentSummary.averageSpeed, previousSummary.averageSpeed);

    const coverageFactor = clamp01(
      Math.min(1, recentSummary.daysWithScore / this.config.trend.recentWindowDays)
      * Math.min(1, previousSummary.daysWithScore / this.config.trend.previousWindowDays),
    );

    const confidence = Confidence.from(
      Math.min(recentSummary.averageConfidence, previousSummary.averageConfidence) * coverageFactor,
    );

    return {
      basis: 'last_7_vs_prev_7',
      recent: recentSummary,
      previous: previousSummary,
      overallDeltaPct,
      speedDeltaPct,
      confidence,
      overallDirection: this.directionFromDelta(overallDeltaPct),
      speedDirection: this.speedDirectionFromDelta(speedDeltaPct),
    };
  }

  private summarizeWindow(
    scores: readonly BrainScore[],
    startDateKey: string,
    endDateKey: string,
  ): TrendWindowSummary {
    return {
      startDateKey,
      endDateKey,
      daysWithScore: scores.length,
      averageScore: average(scores.map((score) => score.score)),
      averageSpeed: average(scores.map((score) => score.components.speed.value)),
      averageConfidence: average(scores.map((score) => score.confidence.value)),
    };
  }

  private directionFromDelta(deltaPct: number): TrendDirection {
    if (Math.abs(deltaPct) < this.config.trend.stableDeltaThresholdPct) {
      return 'stable';
    }

    return deltaPct > 0 ? 'up' : 'down';
  }

  private speedDirectionFromDelta(deltaPct: number): SpeedDirection {
    if (Math.abs(deltaPct) < this.config.trend.stableDeltaThresholdPct) {
      return 'stable';
    }

    return deltaPct > 0 ? 'faster' : 'slower';
  }
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
