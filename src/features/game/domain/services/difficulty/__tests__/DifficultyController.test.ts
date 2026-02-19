import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';

describe('DifficultyController', () => {
  it('raises difficulty when performance is strong', () => {
    const controller = new DifficultyController({
      minLevel: 1,
      maxLevel: 20,
      targetResponseTimeMs: 3500,
    });

    const next = controller.adjustLevel(5, {
      accuracyRate: 0.9,
      averageResponseTimeMs: 1200,
      streakLength: 4,
    });

    expect(next).toBe(6);
  });

  it('lowers difficulty when accuracy drops', () => {
    const controller = new DifficultyController({
      minLevel: 1,
      maxLevel: 20,
      targetResponseTimeMs: 3500,
    });

    const next = controller.adjustLevel(8, {
      accuracyRate: 0.45,
      averageResponseTimeMs: 4100,
      streakLength: 1,
      repeatedMistakes: 2,
    });

    expect(next).toBe(7);
  });

  it('clamps values within policy bounds', () => {
    const controller = new DifficultyController({
      minLevel: 1,
      maxLevel: 10,
      targetResponseTimeMs: 3000,
    });

    const tooLow = controller.adjustLevel(1, {
      accuracyRate: 0.2,
      averageResponseTimeMs: 5000,
      streakLength: 0,
      repeatedMistakes: 4,
    });

    const tooHigh = controller.adjustLevel(10, {
      accuracyRate: 0.95,
      averageResponseTimeMs: 900,
      streakLength: 11,
    });

    expect(tooLow).toBe(1);
    expect(tooHigh).toBe(10);
  });
});
