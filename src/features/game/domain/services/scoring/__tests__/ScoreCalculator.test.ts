import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';

describe('ScoreCalculator', () => {
  it('returns zero for wrong answers', () => {
    const calculator = new ScoreCalculator();

    const score = calculator.calculate({
      isCorrect: false,
      responseTimeMs: 400,
      combo: 5,
      difficultyLevel: 3,
    });

    expect(score).toBe(0);
  });

  it('rewards fast answers more than slow answers', () => {
    const calculator = new ScoreCalculator();

    const fast = calculator.calculate({
      isCorrect: true,
      responseTimeMs: 700,
      combo: 1,
      difficultyLevel: 3,
    });

    const slow = calculator.calculate({
      isCorrect: true,
      responseTimeMs: 4200,
      combo: 1,
      difficultyLevel: 3,
    });

    expect(fast).toBeGreaterThan(slow);
  });

  it('applies combo multiplier on correct answers', () => {
    const calculator = new ScoreCalculator();

    const comboLow = calculator.calculate({
      isCorrect: true,
      responseTimeMs: 1200,
      combo: 1,
      difficultyLevel: 2,
    });

    const comboHigh = calculator.calculate({
      isCorrect: true,
      responseTimeMs: 1200,
      combo: 8,
      difficultyLevel: 2,
    });

    expect(comboHigh).toBeGreaterThan(comboLow);
  });
});
