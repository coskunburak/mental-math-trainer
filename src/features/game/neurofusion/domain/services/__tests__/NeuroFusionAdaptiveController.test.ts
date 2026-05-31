import { getDefaultNeuroFusionConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import { NeuroFusionAdaptiveController } from '@features/game/neurofusion/domain/services/NeuroFusionAdaptiveController';

describe('NeuroFusionAdaptiveController', () => {
  it('keeps adjusted values within configured bounds', () => {
    const config = getDefaultNeuroFusionConfig();
    const controller = new NeuroFusionAdaptiveController(config.adaptive);

    const current = {
      windowScale: 0.4,
      beatsPerQuestion: 10,
      reactionWindowMs: 1_400,
      memorySteps: 12,
      difficultyTier: 60,
    };

    const next = controller.adjust(current, {
      rollingAccuracy: 0.2,
      rollingBeatRate: 0.1,
      recentWrongStreak: 6,
    });

    expect(next.windowScale).toBeLessThanOrEqual(config.adaptive.maxWindowScale);
    expect(next.windowScale).toBeGreaterThanOrEqual(config.adaptive.minWindowScale);
    expect(next.beatsPerQuestion).toBeGreaterThanOrEqual(config.adaptive.minBeatsPerQuestion);
    expect(next.beatsPerQuestion).toBeLessThanOrEqual(config.adaptive.maxBeatsPerQuestion);
    expect(next.reactionWindowMs).toBeGreaterThanOrEqual(config.adaptive.minReactionWindowMs);
    expect(next.reactionWindowMs).toBeLessThanOrEqual(config.adaptive.maxReactionWindowMs);
    expect(next.memorySteps).toBeGreaterThanOrEqual(config.adaptive.minMemorySteps);
    expect(next.memorySteps).toBeLessThanOrEqual(config.adaptive.maxMemorySteps);
  });
});
