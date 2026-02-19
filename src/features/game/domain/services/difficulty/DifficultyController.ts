import { clampDifficulty } from '@features/game/domain/entities/Difficulty';

export interface DifficultyMetrics {
  accuracyRate: number;
  averageResponseTimeMs: number;
  streakLength: number;
  repeatedMistakes?: number;
}

export interface DifficultyPolicy {
  minLevel: number;
  maxLevel: number;
  targetResponseTimeMs: number;
}

const DEFAULT_POLICY: DifficultyPolicy = {
  minLevel: 1,
  maxLevel: 20,
  targetResponseTimeMs: 3_500,
};

export class DifficultyController {
  constructor(private readonly policy: DifficultyPolicy = DEFAULT_POLICY) {}

  adjustLevel(currentLevel: number, metrics: DifficultyMetrics): number {
    let nextLevel = currentLevel;

    if (metrics.accuracyRate > 0.85 && metrics.averageResponseTimeMs <= this.policy.targetResponseTimeMs) {
      nextLevel += 1;
    } else if (metrics.accuracyRate < 0.6 || (metrics.repeatedMistakes ?? 0) >= 3) {
      nextLevel -= 1;
    }

    if (metrics.streakLength >= 10 && metrics.accuracyRate >= 0.8) {
      nextLevel += 1;
    }

    return clampDifficulty(nextLevel, this.policy.minLevel, this.policy.maxLevel);
  }
}
