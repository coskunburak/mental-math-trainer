import { AnalyticsService } from '@core/analytics/AnalyticsService';
import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { DEFAULT_GAME_PROGRESS } from '@features/game/domain/entities/GameProgress';
import type { GameSessionSummary } from '@features/game/domain/entities/ProgressModels';
import { toLocalDateKey } from '@features/game/domain/services/daily/DailyChallenge';

import { GameProgressStore } from '../GameProgressStore';

class InMemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>();

  async getString(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('GameProgressStore', () => {
  function createSummary(overrides: Partial<GameSessionSummary> = {}): GameSessionSummary {
    const base: GameSessionSummary = {
      sessionId: 'session-1',
      mode: 'sprint',
      questionTypes: ['addition', 'subtraction'],
      score: 120,
      accuracyRate: 0.8,
      correctAnswers: 8,
      totalAnswers: 10,
      bestCombo: 4,
      durationSeconds: 60,
      averageResponseTimeMs: 900,
      questionTypeStats: {
        addition: {
          answered: 6,
          correct: 5,
          averageResponseTimeMs: 850,
        },
        subtraction: {
          answered: 4,
          correct: 3,
          averageResponseTimeMs: 980,
        },
      },
      endedAt: Date.UTC(2026, 1, 18, 10, 0, 0),
      gainedXp: 60,
      totalXp: 160,
      levelBefore: 1,
      levelAfter: 2,
      reason: 'timeout',
    };

    return {
      ...base,
      ...overrides,
      mode: overrides.mode ?? base.mode,
      questionTypes: overrides.questionTypes ?? base.questionTypes,
    };
  }

  it('applies session summary to lifetime stats and recent history', () => {
    const track = jest.fn();
    const store = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));

    const next = store.applySession(DEFAULT_GAME_PROGRESS, createSummary());

    expect(next.player.level).toBe(2);
    expect(next.player.xp).toBe(160);
    expect(next.lifetime.sessionsPlayed).toBe(1);
    expect(next.lifetime.bestScore).toBe(120);
    expect(next.lifetime.bestCombo).toBe(4);
    expect(next.lifetime.streakDays).toBe(1);
    expect(next.daily.completions).toBe(0);
    expect(next.analytics.mode.sprint.sessionsPlayed).toBe(1);
    expect(next.analytics.questionType.addition.answered).toBe(6);
    expect(next.monetization.tier).toBe('free');
    expect(next.recentSessions).toHaveLength(1);
  });

  it('increments streak on consecutive days and resets after a gap', () => {
    const track = jest.fn();
    const progressStore = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));

    const first = progressStore.applySession(
      DEFAULT_GAME_PROGRESS,
      createSummary({ endedAt: Date.UTC(2026, 1, 18, 9, 0, 0), sessionId: 's1' }),
    );

    const second = progressStore.applySession(
      first,
      createSummary({ endedAt: Date.UTC(2026, 1, 19, 9, 0, 0), sessionId: 's2' }),
    );

    const third = progressStore.applySession(
      second,
      createSummary({ endedAt: Date.UTC(2026, 1, 23, 9, 0, 0), sessionId: 's3' }),
    );

    expect(second.lifetime.streakDays).toBe(2);
    expect(third.lifetime.streakDays).toBe(1);
  });

  it('loads fallback default when payload is invalid', async () => {
    const track = jest.fn();
    const storage = new InMemoryStore();
    await storage.setString('mental_math_trainer.game_progress.v1', '{invalid-json');

    const progressStore = new GameProgressStore(storage, new AnalyticsService({ track }));
    const loaded = await progressStore.load();

    expect(loaded).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('tracks daily completion and best score when daily challenge is completed', () => {
    const track = jest.fn();
    const progressStore = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));

    const dailyEndedAt = Date.UTC(2026, 1, 20, 15, 30, 0);
    const next = progressStore.applySession(
      DEFAULT_GAME_PROGRESS,
      createSummary({
        mode: 'daily',
        reason: 'daily_complete',
        score: 180,
        sessionId: 'daily-1',
        endedAt: dailyEndedAt,
      }),
    );

    expect(next.daily.completions).toBe(1);
    expect(next.daily.bestScore).toBe(180);
    expect(next.daily.lastCompletedDate).toBe(toLocalDateKey(dailyEndedAt));
    expect(next.analytics.mode.daily.sessionsPlayed).toBe(1);
  });

  it('migrates schema version 1 payloads without losing lifetime stats', async () => {
    const track = jest.fn();
    const storage = new InMemoryStore();

    await storage.setString(
      'mental_math_trainer.game_progress.v1',
      JSON.stringify({
        schemaVersion: 1,
        data: {
          player: { xp: 240, level: 3 },
          lifetime: {
            sessionsPlayed: 4,
            totalAnswers: 42,
            totalCorrectAnswers: 35,
            bestScore: 320,
            bestCombo: 9,
            totalPlayTimeSeconds: 410,
            streakDays: 3,
            lastPlayedDate: '2026-02-18',
          },
          recentSessions: [],
        },
      }),
    );

    const progressStore = new GameProgressStore(storage, new AnalyticsService({ track }));
    const loaded = await progressStore.load();

    expect(loaded.player.xp).toBe(240);
    expect(loaded.lifetime.sessionsPlayed).toBe(4);
    expect(loaded.daily.completions).toBe(0);
    expect(loaded.daily.bestScore).toBe(0);
    expect(loaded.analytics.mode.daily.sessionsPlayed).toBe(0);
    expect(loaded.monetization.tier).toBe('free');
  });

  it('applies premium upgrade exactly once', () => {
    const track = jest.fn();
    const progressStore = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));

    const upgraded = progressStore.applyPremiumUpgrade(DEFAULT_GAME_PROGRESS, 123_000);
    const upgradedAgain = progressStore.applyPremiumUpgrade(upgraded, 999_000);

    expect(upgraded.monetization.tier).toBe('premium');
    expect(upgraded.monetization.premiumActivatedAt).toBe(123_000);
    expect(upgradedAgain.monetization.premiumActivatedAt).toBe(123_000);
  });

  it('applies rewarded ad bonus once per session for free users', () => {
    const track = jest.fn();
    const progressStore = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));

    const first = progressStore.applyRewardedAdBonus(DEFAULT_GAME_PROGRESS, 'session-1', 20);
    const duplicate = progressStore.applyRewardedAdBonus(first, 'session-1', 20);

    expect(first.player.xp).toBe(20);
    expect(first.player.level).toBe(1);
    expect(first.monetization.rewardedAdsWatched).toBe(1);
    expect(first.monetization.rewardedXpClaimed).toBe(20);
    expect(duplicate.player.xp).toBe(20);
    expect(duplicate.monetization.rewardedAdsWatched).toBe(1);
  });

  it('saves custom training settings with normalization', () => {
    const track = jest.fn();
    const progressStore = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));

    const next = progressStore.applyCustomTrainingSettings(DEFAULT_GAME_PROGRESS, {
      durationSeconds: 20,
      questionLimit: 2,
      questionTypes: ['addition', 'addition', 'division'],
    });

    expect(next.customTraining.durationSeconds).toBe(30);
    expect(next.customTraining.questionLimit).toBe(5);
    expect(next.customTraining.questionTypes).toEqual(['addition', 'division']);
  });

  it('migrates schema version 4 payloads and injects default custom training', async () => {
    const track = jest.fn();
    const storage = new InMemoryStore();

    await storage.setString(
      'mental_math_trainer.game_progress.v1',
      JSON.stringify({
        schemaVersion: 4,
        data: {
          player: { xp: 90, level: 1 },
          lifetime: DEFAULT_GAME_PROGRESS.lifetime,
          daily: DEFAULT_GAME_PROGRESS.daily,
          analytics: {
            mode: {
              daily: DEFAULT_GAME_PROGRESS.analytics.mode.daily,
              sprint: DEFAULT_GAME_PROGRESS.analytics.mode.sprint,
              survival: DEFAULT_GAME_PROGRESS.analytics.mode.survival,
              zen: DEFAULT_GAME_PROGRESS.analytics.mode.zen,
            },
            questionType: DEFAULT_GAME_PROGRESS.analytics.questionType,
          },
          monetization: DEFAULT_GAME_PROGRESS.monetization,
          recentSessions: [],
        },
      }),
    );

    const progressStore = new GameProgressStore(storage, new AnalyticsService({ track }));
    const loaded = await progressStore.load();

    expect(loaded.player.xp).toBe(90);
    expect(loaded.customTraining).toEqual(DEFAULT_GAME_PROGRESS.customTraining);
    expect(loaded.analytics.mode.custom).toEqual(DEFAULT_GAME_PROGRESS.analytics.mode.custom);
  });

  it('does not apply rewarded ad bonus when user is premium', () => {
    const track = jest.fn();
    const progressStore = new GameProgressStore(new InMemoryStore(), new AnalyticsService({ track }));
    const premium = progressStore.applyPremiumUpgrade(DEFAULT_GAME_PROGRESS, 123);

    const next = progressStore.applyRewardedAdBonus(premium, 'session-2', 20);

    expect(next.player.xp).toBe(premium.player.xp);
    expect(next.monetization.rewardedAdsWatched).toBe(premium.monetization.rewardedAdsWatched);
  });
});
