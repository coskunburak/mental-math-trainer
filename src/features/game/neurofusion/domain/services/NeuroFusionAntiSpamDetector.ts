import type { NeuroFusionAntiSpamConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

export interface SpamDetectionResult {
  isSpam: boolean;
  recentInputCount: number;
}

export class NeuroFusionAntiSpamDetector {
  private readonly recentInputsMs: number[] = [];
  private lastPenaltyAtMs = Number.NEGATIVE_INFINITY;

  constructor(private readonly config: NeuroFusionAntiSpamConfig) {}

  registerInput(timestampMs: number): SpamDetectionResult {
    this.recentInputsMs.push(timestampMs);
    this.prune(timestampMs);

    const tooManyInputs = this.recentInputsMs.length > this.config.maxInputsInWindow;
    const cooldownActive = timestampMs - this.lastPenaltyAtMs < this.config.penaltyCooldownMs;
    const isSpam = tooManyInputs && !cooldownActive;

    if (isSpam) {
      this.lastPenaltyAtMs = timestampMs;
    }

    return {
      isSpam,
      recentInputCount: this.recentInputsMs.length,
    };
  }

  reset(): void {
    this.recentInputsMs.length = 0;
    this.lastPenaltyAtMs = Number.NEGATIVE_INFINITY;
  }

  private prune(nowMs: number): void {
    while (
      this.recentInputsMs.length > 0 &&
      nowMs - this.recentInputsMs[0] > this.config.windowMs
    ) {
      this.recentInputsMs.shift();
    }
  }
}
