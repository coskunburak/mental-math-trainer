import { DEFAULT_GAME_PROGRESS } from '@features/game/domain/entities/GameProgress';

import {
  buildDailyChallengePlan,
  isDailyChallengeCompletedToday,
  toLocalDateKey,
} from '../DailyChallenge';

describe('DailyChallenge', () => {
  it('returns deterministic seed for the same day', () => {
    const timestamp = Date.UTC(2026, 1, 18, 12, 0, 0);
    const planA = buildDailyChallengePlan(5, timestamp);
    const planB = buildDailyChallengePlan(5, timestamp);

    expect(planA.seed).toBe(planB.seed);
    expect(planA.questionLimit).toBe(12);
    expect(planA.durationSeconds).toBe(90);
  });

  it('marks completed only when last completion date equals today', () => {
    const now = Date.UTC(2026, 1, 18, 16, 0, 0);
    const completedProgress = {
      ...DEFAULT_GAME_PROGRESS,
      daily: {
        ...DEFAULT_GAME_PROGRESS.daily,
        lastCompletedDate: toLocalDateKey(now),
      },
    };

    expect(isDailyChallengeCompletedToday(completedProgress, now)).toBe(true);
    expect(isDailyChallengeCompletedToday(DEFAULT_GAME_PROGRESS, now)).toBe(false);
  });
});
