import { getDefaultNeuroFusionConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import { NeuroFusionScoringService } from '@features/game/neurofusion/domain/services/NeuroFusionScoringService';

describe('NeuroFusionScoringService', () => {
  it('applies rhythm bonus and combo multiplier for correct answers', () => {
    const scoring = new NeuroFusionScoringService(getDefaultNeuroFusionConfig());

    const perfect = scoring.score({
      kind: 'rhythm_question',
      isCorrect: true,
      beatAccuracy: 'perfect',
      responseTimeMs: 320,
      combo: 6,
      insightMultiplier: 1,
      difficultyTier: 3,
      isBoss: false,
      spamDetected: false,
      currentFlow: 20,
    });

    const offbeat = scoring.score({
      kind: 'rhythm_question',
      isCorrect: true,
      beatAccuracy: 'offbeat',
      responseTimeMs: 320,
      combo: 6,
      insightMultiplier: 1,
      difficultyTier: 3,
      isBoss: false,
      spamDetected: false,
      currentFlow: 20,
    });

    expect(perfect.scoreDelta).toBeGreaterThan(offbeat.scoreDelta);
  });

  it('penalizes wrong answers and resets combo', () => {
    const scoring = new NeuroFusionScoringService(getDefaultNeuroFusionConfig());

    const wrong = scoring.score({
      kind: 'reaction_gate',
      isCorrect: false,
      beatAccuracy: 'offbeat',
      responseTimeMs: 680,
      combo: 11,
      insightMultiplier: 1,
      difficultyTier: 3,
      isBoss: true,
      spamDetected: true,
      currentFlow: 40,
    });

    expect(wrong.scoreDelta).toBeLessThan(0);
    expect(wrong.comboAfter).toBe(0);
    expect(wrong.flowDelta).toBeLessThan(0);
  });
});
