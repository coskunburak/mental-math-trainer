import type { AnalyticsClient } from '@core/analytics/AnalyticsClient';
import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { gameEvents } from '@core/analytics/events';
import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';
import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';

import { GameStore, type GameSessionConfig } from '../gameStore';

describe('GameStore', () => {
  function createFixture(config: GameSessionConfig = { mode: 'sprint', allowedQuestionTypes: ['addition', 'subtraction'] }) {
    let now = 10_000;
    const track = jest.fn();

    const analyticsClient: AnalyticsClient = {
      track,
    };

    const store = new GameStore(
      {
        env: {
          runtime: 'test',
          sessionDurationSeconds: 60,
          difficultyFloor: 1,
          difficultyCeiling: 20,
        },
        analytics: new AnalyticsService(analyticsClient),
        questionGeneratorFactory: (seed, allowedTypes) => new QuestionGenerator({ seed, allowedTypes }),
        scoreCalculator: new ScoreCalculator(),
        answerValidator: new AnswerValidator(),
        difficultyController: new DifficultyController({
          minLevel: 1,
          maxLevel: 20,
          targetResponseTimeMs: 3500,
        }),
        now: () => now,
      },
      { xp: 0, level: 1 },
      config,
    );

    const advance = (ms: number) => {
      now += ms;
    };

    return {
      store,
      track,
      advance,
    };
  }

  it('starts a running sprint session with first question', () => {
    const { store, track } = createFixture();

    store.startSession(123);

    const state = store.getState();

    expect(state.phase).toBe('running');
    expect(state.session).not.toBeNull();
    expect(state.currentQuestion).not.toBeNull();
    expect(track).toHaveBeenCalledWith(
      gameEvents.sessionStart,
      expect.objectContaining({
        mode: 'sprint',
      }),
    );
  });

  it('updates score and combo on correct answer, then resets combo on wrong answer', () => {
    const { store, advance } = createFixture();

    store.startSession(7);

    const firstQuestion = store.getState().currentQuestion;
    if (!firstQuestion) {
      throw new Error('Question should exist after session start');
    }

    advance(800);
    firstQuestion.answer
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));

    const acceptedCorrect = store.submitAnswer();
    expect(acceptedCorrect).toBe(true);

    let state = store.getState();
    expect(state.session?.score ?? 0).toBeGreaterThan(0);
    expect(state.session?.combo).toBe(1);

    const secondQuestion = state.currentQuestion;
    if (!secondQuestion) {
      throw new Error('Second question should exist after first submit');
    }

    const wrongValue = secondQuestion.answer + 1;
    wrongValue
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));

    const acceptedWrong = store.submitAnswer();
    expect(acceptedWrong).toBe(true);

    state = store.getState();
    expect(state.session?.combo).toBe(0);
    expect(state.lastAnswerCorrect).toBe(false);
  });

  it('finishes automatically when timer reaches zero and emits summary', () => {
    const { store, track } = createFixture();

    store.startSession(14);
    store.tick(60_000);

    const state = store.getState();

    expect(state.phase).toBe('finished');
    expect(state.summary).not.toBeNull();
    expect(state.remainingMs).toBe(0);

    expect(track).toHaveBeenCalledWith(
      gameEvents.sessionEnd,
      expect.objectContaining({
        reason: 'timeout',
      }),
    );
  });

  it('ends survival mode immediately after the first mistake', () => {
    const { store } = createFixture({
      mode: 'survival',
      allowedQuestionTypes: ['addition'],
    });

    store.startSession(55);

    const currentQuestion = store.getState().currentQuestion;
    if (!currentQuestion) {
      throw new Error('Question should exist in survival mode');
    }

    const wrongAnswer = currentQuestion.answer + 1;
    wrongAnswer
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));

    const accepted = store.submitAnswer();
    expect(accepted).toBe(true);

    const state = store.getState();
    expect(state.phase).toBe('finished');
    expect(state.summary?.reason).toBe('mistake');
    expect(state.summary?.mode).toBe('survival');
  });

  it('keeps zen mode untimed and running even when tick advances', () => {
    const { store } = createFixture({
      mode: 'zen',
      allowedQuestionTypes: ['addition'],
    });

    store.startSession(77);
    expect(store.getState().isTimedMode).toBe(false);
    expect(store.getState().remainingMs).toBe(0);

    store.tick(45_000);

    const state = store.getState();
    expect(state.phase).toBe('running');
    expect(state.remainingMs).toBe(0);
  });

  it('completes daily mode when configured question limit is reached', () => {
    const { store } = createFixture({
      mode: 'daily',
      allowedQuestionTypes: ['addition'],
      questionLimitOverride: 1,
      durationSecondsOverride: 90,
      seedOverride: 999,
    });

    store.startSession();

    const firstQuestion = store.getState().currentQuestion;
    if (!firstQuestion) {
      throw new Error('Question should exist after daily start');
    }

    firstQuestion.answer
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));

    const accepted = store.submitAnswer();
    expect(accepted).toBe(true);

    const state = store.getState();
    expect(state.phase).toBe('finished');
    expect(state.summary?.mode).toBe('daily');
    expect(state.summary?.reason).toBe('daily_complete');
  });

  it('completes custom mode when configured question limit is reached', () => {
    const { store } = createFixture({
      mode: 'custom',
      allowedQuestionTypes: ['addition', 'subtraction'],
      questionLimitOverride: 1,
      durationSecondsOverride: 120,
      seedOverride: 321,
    });

    store.startSession();

    const firstQuestion = store.getState().currentQuestion;
    if (!firstQuestion) {
      throw new Error('Question should exist after custom start');
    }

    firstQuestion.answer
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));

    const accepted = store.submitAnswer();
    expect(accepted).toBe(true);

    const state = store.getState();
    expect(state.phase).toBe('finished');
    expect(state.summary?.mode).toBe('custom');
    expect(state.summary?.reason).toBe('question_limit');
  });

  it('uses daily seed override for deterministic first question', () => {
    const fixtureA = createFixture({
      mode: 'daily',
      allowedQuestionTypes: ['addition', 'subtraction'],
      seedOverride: 123456,
      questionLimitOverride: 12,
    });

    const fixtureB = createFixture({
      mode: 'daily',
      allowedQuestionTypes: ['addition', 'subtraction'],
      seedOverride: 123456,
      questionLimitOverride: 12,
    });

    fixtureA.store.startSession();
    fixtureB.store.startSession();

    expect(fixtureA.store.getState().currentQuestion).toEqual(fixtureB.store.getState().currentQuestion);
  });

  it('adds response and per-type metrics to session summary', () => {
    const { store, advance } = createFixture({
      mode: 'sprint',
      allowedQuestionTypes: ['addition'],
    });

    store.startSession(91);

    const first = store.getState().currentQuestion;
    if (!first) {
      throw new Error('Expected first question');
    }

    advance(500);
    first.answer
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));
    expect(store.submitAnswer()).toBe(true);

    const second = store.getState().currentQuestion;
    if (!second) {
      throw new Error('Expected second question');
    }

    advance(1500);
    second.answer
      .toString()
      .split('')
      .forEach((digit) => store.appendDigit(digit));
    expect(store.submitAnswer()).toBe(true);

    store.finishSession('manual');

    const summary = store.getState().summary;
    expect(summary).not.toBeNull();
    expect(summary?.averageResponseTimeMs).toBe(1000);
    expect(summary?.questionTypeStats.addition?.answered).toBe(2);
    expect(summary?.questionTypeStats.addition?.correct).toBe(2);
  });
});
