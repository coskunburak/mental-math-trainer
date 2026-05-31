import type { AnswerEvent, OperationType } from '@features/game/domain/entities/AnswerEvent';
import { BrainScoreCalculator } from '@features/game/domain/services/brain/BrainScoreCalculator';

import { brainScoreGoldenExpected, brainScoreGoldenFixtureEvents } from './fixtures/brainScoreGoldenFixture';

describe('BrainScoreCalculator', () => {
  it('does not let fast answers on easy tiers inflate Brain Power', () => {
    const calculator = new BrainScoreCalculator();

    const easyFast = buildBatch({
      count: 40,
      operationType: 'add',
      difficultyTier: 1,
      stepCount: 1,
      isCorrect: true,
      responseTimeMs: 340,
      sessionId: 'easy-fast',
    });

    const hardStrong = buildBatch({
      count: 40,
      operationType: 'mul',
      difficultyTier: 6,
      stepCount: 4,
      isCorrect: true,
      responseTimeMs: 2_250,
      sessionId: 'hard-strong',
    });

    const easyScore = calculator.calculate({ events: easyFast });
    const hardScore = calculator.calculate({ events: hardStrong });

    expect(hardScore.score).toBeGreaterThan(easyScore.score);
    expect(hardScore.components.hardPerf.value).toBeGreaterThan(easyScore.components.hardPerf.value);
  });

  it('increases score when hard questions become fast and correct', () => {
    const calculator = new BrainScoreCalculator();

    const commonEasy = buildBatch({
      count: 20,
      operationType: 'add',
      difficultyTier: 2,
      stepCount: 1,
      isCorrect: true,
      responseTimeMs: 950,
      sessionId: 'shared',
    });

    const hardWeak = buildBatch({
      count: 16,
      operationType: 'sequence',
      difficultyTier: 7,
      stepCount: 5,
      isCorrect: false,
      responseTimeMs: 3_300,
      sessionId: 'hard-weak',
      startIndexOffset: 500,
    });

    const hardStrong = buildBatch({
      count: 16,
      operationType: 'sequence',
      difficultyTier: 7,
      stepCount: 5,
      isCorrect: true,
      responseTimeMs: 2_250,
      sessionId: 'hard-strong',
      startIndexOffset: 500,
    });

    const baseline = calculator.calculate({ events: [...commonEasy, ...hardWeak] });
    const improved = calculator.calculate({ events: [...commonEasy, ...hardStrong] });

    expect(improved.score).toBeGreaterThan(baseline.score);
    expect(improved.components.hardPerf.value).toBeGreaterThan(baseline.components.hardPerf.value);
  });

  it('applies guessing penalty for very fast and frequently wrong answers', () => {
    const calculator = new BrainScoreCalculator();

    const clean = buildBatch({
      count: 24,
      operationType: 'mixed',
      difficultyTier: 4,
      stepCount: 3,
      isCorrect: true,
      responseTimeMs: 1_550,
      sessionId: 'clean',
    });

    const spamGuess = buildBatch({
      count: 12,
      operationType: 'mixed',
      difficultyTier: 4,
      stepCount: 3,
      isCorrect: false,
      responseTimeMs: 280,
      sessionId: 'guess',
      startIndexOffset: 2_000,
    });

    const cleanScore = calculator.calculate({ events: clean });
    const guessedScore = calculator.calculate({ events: [...clean, ...spamGuess] });

    expect(guessedScore.quality.guessingPenalty).toBeGreaterThan(0);
    expect(guessedScore.quality.spamPenalty).toBeGreaterThan(0);
    expect(guessedScore.score).toBeLessThan(cleanScore.score);
  });

  it('matches the golden fixture output for deterministic scoring', () => {
    const calculator = new BrainScoreCalculator();

    const score = calculator.calculate({
      events: brainScoreGoldenFixtureEvents,
      dateKey: '2026-02-01',
    });

    expect({
      dateKey: score.dateKey,
      score: score.score,
      normalizedScore: round4(score.normalizedScore.value),
      components: {
        speed: round4(score.components.speed.value),
        accuracy: round4(score.components.accuracy.value),
        hardPerf: round4(score.components.hardPerf.value),
      },
      confidence: round4(score.confidence.value),
      quality: {
        guessingPenalty: round4(score.quality.guessingPenalty),
        spamPenalty: round4(score.quality.spamPenalty),
        penaltyMultiplier: round4(score.quality.penaltyMultiplier),
        fastWrongRate: round4(score.quality.fastWrongRate),
        spamTapRuns: score.quality.spamTapRuns,
      },
    }).toEqual(brainScoreGoldenExpected);
  });
});

interface BuildBatchOptions {
  count: number;
  operationType: OperationType;
  difficultyTier: number;
  stepCount: number;
  isCorrect: boolean;
  responseTimeMs: number;
  sessionId: string;
  startIndexOffset?: number;
}

function buildBatch(options: BuildBatchOptions): AnswerEvent[] {
  const output: AnswerEvent[] = [];
  const offset = options.startIndexOffset ?? 0;

  for (let index = 0; index < options.count; index += 1) {
    output.push({
      occurredAt: new Date(Date.UTC(2026, 1, 1, 10, 0, index + offset)).toISOString(),
      operationType: options.operationType,
      difficultyTier: options.difficultyTier,
      stepCount: options.stepCount,
      isCorrect: options.isCorrect,
      responseTimeMs: options.responseTimeMs,
      sessionId: options.sessionId,
      questionId: `${options.sessionId}-${index + offset}`,
    });
  }

  return output;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
