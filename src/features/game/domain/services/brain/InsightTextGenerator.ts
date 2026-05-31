import type { BrainTrend } from '@features/game/domain/entities/BrainTrend';
import type { BrainPowerConfig } from '@features/game/domain/services/brain/BrainPowerConfig';
import { DEFAULT_BRAIN_POWER_CONFIG } from '@features/game/domain/services/brain/BrainPowerConfig';

export interface BrainInsightText {
  overall: string;
  speed: string;
  confidenceLabel: 'low' | 'medium' | 'high';
}

export class InsightTextGenerator {
  constructor(private readonly config: BrainPowerConfig = DEFAULT_BRAIN_POWER_CONFIG) {}

  generateTrendInsight(trend: BrainTrend | null): BrainInsightText {
    if (!trend) {
      return {
        overall: 'Not enough data yet to estimate a reliable 30-day Brain Power trend.',
        speed: 'Keep practicing this week to unlock a speed insight.',
        confidenceLabel: 'low',
      };
    }

    const stableThreshold = this.config.trend.stableDeltaThresholdPct;
    const lowConfidence = trend.confidence.isLow(this.config.confidence.lowConfidenceThreshold);

    const overallDelta = Math.round(Math.abs(trend.overallDeltaPct));
    const speedDelta = Math.round(Math.abs(trend.speedDeltaPct));

    return {
      overall: this.buildOverallCopy(
        trend.overallDeltaPct,
        overallDelta,
        stableThreshold,
        lowConfidence,
      ),
      speed: this.buildSpeedCopy(
        trend.speedDeltaPct,
        speedDelta,
        stableThreshold,
        lowConfidence,
      ),
      confidenceLabel: toConfidenceLabel(trend.confidence.value),
    };
  }

  private buildOverallCopy(
    deltaPct: number,
    deltaRounded: number,
    stableThreshold: number,
    lowConfidence: boolean,
  ): string {
    if (Math.abs(deltaPct) < stableThreshold) {
      return lowConfidence
        ? 'Early signal: overall Brain Power appears stable over the last 30 days.'
        : 'Your Brain Power stayed stable over the last 30 days.';
    }

    if (deltaPct > 0) {
      return lowConfidence
        ? `Early signal: your Brain Power may be up about ${deltaRounded}% over the last 30 days.`
        : `Your Brain Power improved by ${deltaRounded}% over the last 30 days.`;
    }

    return lowConfidence
      ? `Early signal: your Brain Power may be down about ${deltaRounded}% over the last 30 days.`
      : `Your Brain Power is slightly lower recently (${deltaRounded}% over the last 30 days).`;
  }

  private buildSpeedCopy(
    deltaPct: number,
    deltaRounded: number,
    stableThreshold: number,
    lowConfidence: boolean,
  ): string {
    if (Math.abs(deltaPct) < stableThreshold) {
      return lowConfidence
        ? 'Early signal: speed looks stable recently.'
        : 'Your speed is stable recently.';
    }

    if (deltaPct > 0) {
      return lowConfidence
        ? `Early signal: you may be ${deltaRounded}% faster in the last 30 days.`
        : `Your brain got ${deltaRounded}% faster in the last 30 days.`;
    }

    return lowConfidence
      ? `Early signal: you may be ${deltaRounded}% slower recently.`
      : `You were slightly slower recently (${deltaRounded}% in the last 30 days).`;
  }
}

function toConfidenceLabel(value: number): 'low' | 'medium' | 'high' {
  if (value < 0.6) {
    return 'low';
  }

  if (value < 0.8) {
    return 'medium';
  }

  return 'high';
}
