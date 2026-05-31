import type { AnalyticsParams } from '@core/analytics/AnalyticsClient';
import type { BrainScoreComputedEvent, BrainInsightGeneratedEvent, WeakAreasComputedEvent } from '@core/analytics/events/brainEvents';
import type { BrainScore } from '@features/game/domain/entities/BrainScore';
import type { BrainTrend } from '@features/game/domain/entities/BrainTrend';
import type { WeaknessReport } from '@features/game/domain/entities/WeakArea';

export function toBrainScoreComputedTelemetry(score: BrainScore): BrainScoreComputedEvent & AnalyticsParams {
  return {
    score: score.score,
    speed_component: round4(score.components.speed.value),
    accuracy_component: round4(score.components.accuracy.value),
    hard_perf_component: round4(score.components.hardPerf.value),
    confidence: round4(score.confidence.value),
    window: `${score.window.startedAt}/${score.window.endedAt}`,
  };
}

export function toBrainInsightTelemetry(
  trend: BrainTrend,
): Array<BrainInsightGeneratedEvent & AnalyticsParams> {
  return [
    {
      type: 'overall',
      confidence: round4(trend.confidence.value),
      delta_pct: round2(trend.overallDeltaPct),
    },
    {
      type: 'speed',
      confidence: round4(trend.confidence.value),
      delta_pct: round2(trend.speedDeltaPct),
    },
  ];
}

export function toWeakAreasTelemetry(
  report: WeaknessReport,
): WeakAreasComputedEvent & AnalyticsParams {
  return {
    count: report.topWeakAreas.length,
    top_area_type: report.topWeakAreas[0]?.operationType ?? 'none',
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
