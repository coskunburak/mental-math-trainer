export interface ScoreInput {
  isCorrect: boolean;
  responseTimeMs: number;
  combo: number;
  difficultyLevel: number;
}

export class ScoreCalculator {
  private static readonly MAX_BONUS_WINDOW_MS = 5_000;

  calculate(input: ScoreInput): number {
    if (!input.isCorrect) {
      return 0;
    }

    const basePoints = 10 + input.difficultyLevel * 2;
    const speedBonus = Math.max(0, Math.round((ScoreCalculator.MAX_BONUS_WINDOW_MS - input.responseTimeMs) / 250));
    const comboMultiplier = 1 + Math.min(input.combo, 20) * 0.05;

    return Math.round((basePoints + speedBonus) * comboMultiplier);
  }
}
