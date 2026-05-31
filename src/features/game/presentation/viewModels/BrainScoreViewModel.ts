import type { BrainScore } from '@features/game/domain/entities/BrainScore';
import type { BrainTrend } from '@features/game/domain/entities/BrainTrend';
import type { WeaknessReport } from '@features/game/domain/entities/WeakArea';
import type { BrainInsightText } from '@features/game/domain/services/brain/InsightTextGenerator';

export interface BrainScoreViewModel {
  brainPower: number;
  brainPowerLabel: string;
  confidence: number;
  confidenceLabel: string;
  components: {
    speedPct: number;
    accuracyPct: number;
    hardPerfPct: number;
  };
  trend: {
    overallDeltaPct: number | null;
    speedDeltaPct: number | null;
    overallText: string;
    speedText: string;
  };
  weakAreas: WeaknessReport;
}

export function toBrainScoreViewModel(
  score: BrainScore,
  trend: BrainTrend | null,
  insight: BrainInsightText,
  weakAreas: WeaknessReport,
): BrainScoreViewModel {
  return {
    brainPower: score.score,
    brainPowerLabel: `${score.score}/1000`,
    confidence: round2(score.confidence.value),
    confidenceLabel: insight.confidenceLabel,
    components: {
      speedPct: score.components.speed.toPercentage(),
      accuracyPct: score.components.accuracy.toPercentage(),
      hardPerfPct: score.components.hardPerf.toPercentage(),
    },
    trend: {
      overallDeltaPct: trend ? round2(trend.overallDeltaPct) : null,
      speedDeltaPct: trend ? round2(trend.speedDeltaPct) : null,
      overallText: insight.overall,
      speedText: insight.speed,
    },
    weakAreas,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
