import type {
  NeuroFusionAdaptiveConfig,
  NeuroFusionDifficultyMetrics,
  NeuroFusionDynamicState,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

export class NeuroFusionAdaptiveController {
  constructor(private readonly config: NeuroFusionAdaptiveConfig) {}

  adjust(
    current: NeuroFusionDynamicState,
    metrics: NeuroFusionDifficultyMetrics,
  ): NeuroFusionDynamicState {
    let windowScale = current.windowScale;
    let beatsPerQuestion = current.beatsPerQuestion;
    let reactionWindowMs = current.reactionWindowMs;
    let memorySteps = current.memorySteps;
    let difficultyTier = current.difficultyTier;

    const underperforming =
      metrics.rollingAccuracy < this.config.lowAccuracyThreshold ||
      metrics.rollingBeatRate < this.config.lowBeatRateThreshold ||
      metrics.recentWrongStreak >= 3;

    const overperforming =
      metrics.rollingAccuracy > this.config.highAccuracyThreshold &&
      metrics.rollingBeatRate > this.config.highBeatRateThreshold &&
      metrics.recentWrongStreak === 0;

    if (underperforming) {
      windowScale *= this.config.widenWindowFactor;
      beatsPerQuestion += this.config.beatsPerQuestionRecoveryStep;
      reactionWindowMs += this.config.reactionWindowRecoveryMs;
      memorySteps -= 1;
      difficultyTier -= 1;
    } else if (overperforming) {
      windowScale *= this.config.tightenWindowFactor;
      beatsPerQuestion -= this.config.beatsPerQuestionPressureStep;
      reactionWindowMs -= this.config.reactionWindowPressureMs;
      memorySteps += 1;
      difficultyTier += 1;
    }

    return {
      windowScale: clamp(windowScale, this.config.minWindowScale, this.config.maxWindowScale),
      beatsPerQuestion: Math.round(
        clamp(beatsPerQuestion, this.config.minBeatsPerQuestion, this.config.maxBeatsPerQuestion),
      ),
      reactionWindowMs: Math.round(
        clamp(reactionWindowMs, this.config.minReactionWindowMs, this.config.maxReactionWindowMs),
      ),
      memorySteps: Math.round(clamp(memorySteps, this.config.minMemorySteps, this.config.maxMemorySteps)),
      difficultyTier: Math.round(clamp(difficultyTier, 1, 99)),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
