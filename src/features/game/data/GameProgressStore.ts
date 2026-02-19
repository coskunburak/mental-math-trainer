import { gameEvents } from '@core/analytics/events';
import { AnalyticsService } from '@core/analytics/AnalyticsService';
import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';
import {
  DEFAULT_GAME_PROGRESS,
  RECENT_SESSION_LIMIT,
  type GameProgress,
} from '@features/game/domain/entities/GameProgress';
import { isPremiumTier } from '@features/game/domain/entities/Monetization';
import type { QuestionType } from '@features/game/domain/entities/Question';
import type { GameSessionSummary } from '@features/game/domain/entities/ProgressModels';
import { toLocalDateKey } from '@features/game/domain/services/daily/DailyChallenge';

const CURRENT_SCHEMA_VERSION = 5;

interface PersistedGameProgress {
  schemaVersion: number;
  data: unknown;
}

export class GameProgressStore {
  constructor(
    private readonly storage: KeyValueStore,
    private readonly analytics: AnalyticsService,
  ) {}

  async load(): Promise<GameProgress> {
    const raw = await this.storage.getString(storageKeys.gameProgress);
    if (!raw) {
      return DEFAULT_GAME_PROGRESS;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedGameProgress;
      if (!parsed || typeof parsed.schemaVersion !== 'number') {
        return DEFAULT_GAME_PROGRESS;
      }

      const migrated = migrateProgress(parsed.schemaVersion, parsed.data);
      if (!migrated) {
        return DEFAULT_GAME_PROGRESS;
      }

      const normalized = normalizeProgress(migrated);
      this.trackRetention(normalized);
      return normalized;
    } catch {
      return DEFAULT_GAME_PROGRESS;
    }
  }

  async save(progress: GameProgress): Promise<void> {
    const payload: PersistedGameProgress = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data: normalizeProgress(progress),
    };

    await this.storage.setString(storageKeys.gameProgress, JSON.stringify(payload));
  }

  applySession(progress: GameProgress, summary: GameSessionSummary): GameProgress {
    const today = toDateKey(summary.endedAt);
    const streakDays = computeStreak(progress.lifetime.lastPlayedDate, today, progress.lifetime.streakDays);

    const completedDaily = summary.mode === 'daily' && summary.reason === 'daily_complete';
    const dailyDateKey = toLocalDateKey(summary.endedAt);

    const next: GameProgress = {
      player: {
        xp: summary.totalXp,
        level: summary.levelAfter,
      },
      lifetime: {
        sessionsPlayed: progress.lifetime.sessionsPlayed + 1,
        totalAnswers: progress.lifetime.totalAnswers + summary.totalAnswers,
        totalCorrectAnswers: progress.lifetime.totalCorrectAnswers + summary.correctAnswers,
        bestScore: Math.max(progress.lifetime.bestScore, summary.score),
        bestCombo: Math.max(progress.lifetime.bestCombo, summary.bestCombo),
        totalPlayTimeSeconds: progress.lifetime.totalPlayTimeSeconds + summary.durationSeconds,
        streakDays,
        lastPlayedDate: today,
      },
      daily: {
        completions: progress.daily.completions + (completedDaily ? 1 : 0),
        bestScore:
          summary.mode === 'daily'
            ? Math.max(progress.daily.bestScore, summary.score)
            : progress.daily.bestScore,
        lastCompletedDate: completedDaily ? dailyDateKey : progress.daily.lastCompletedDate,
      },
      analytics: applyAnalyticsSummary(progress.analytics, summary),
      customTraining: progress.customTraining,
      monetization: progress.monetization,
      recentSessions: [summary, ...progress.recentSessions].slice(0, RECENT_SESSION_LIMIT),
    };

    return normalizeProgress(next);
  }

  applyCustomTrainingSettings(
    progress: GameProgress,
    settings: Partial<GameProgress['customTraining']>,
  ): GameProgress {
    const next: GameProgress = {
      ...progress,
      customTraining: {
        ...progress.customTraining,
        ...settings,
      },
    };

    return normalizeProgress(next);
  }

  applyPremiumUpgrade(progress: GameProgress, activatedAt = Date.now()): GameProgress {
    if (progress.monetization.tier === 'premium') {
      return progress;
    }

    const next: GameProgress = {
      ...progress,
      monetization: {
        ...progress.monetization,
        tier: 'premium',
        premiumActivatedAt: activatedAt,
      },
    };

    return normalizeProgress(next);
  }

  applyRewardedAdBonus(progress: GameProgress, sessionId: string, bonusXp: number): GameProgress {
    if (isPremiumTier(progress.monetization.tier) || bonusXp <= 0) {
      return progress;
    }

    if (progress.monetization.lastRewardedSessionId === sessionId) {
      return progress;
    }

    const totalXp = progress.player.xp + Math.floor(bonusXp);
    const next: GameProgress = {
      ...progress,
      player: {
        xp: totalXp,
        level: levelFromXp(totalXp),
      },
      monetization: {
        ...progress.monetization,
        rewardedAdsWatched: progress.monetization.rewardedAdsWatched + 1,
        rewardedXpClaimed: progress.monetization.rewardedXpClaimed + Math.floor(bonusXp),
        lastRewardedSessionId: sessionId,
      },
    };

    return normalizeProgress(next);
  }

  private trackRetention(progress: GameProgress): void {
    if (!progress.lifetime.lastPlayedDate) {
      return;
    }

    const nowKey = toDateKey(Date.now());
    const daysSinceLastSession = diffDays(progress.lifetime.lastPlayedDate, nowKey);

    this.analytics.track(gameEvents.retention, {
      days_since_last_session: daysSinceLastSession,
      streak_days: progress.lifetime.streakDays,
      sessions_played: progress.lifetime.sessionsPlayed,
    });
  }
}

function migrateProgress(schemaVersion: number, data: unknown): GameProgress | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const base = coerceProgressShape(data as Partial<GameProgress>);

  if (schemaVersion === 1 || schemaVersion === 2 || schemaVersion === 3 || schemaVersion === 4 || schemaVersion === 5) {
    return base;
  }

  return null;
}

function coerceProgressShape(progress: Partial<GameProgress>): GameProgress {
  return {
    player: {
      ...DEFAULT_GAME_PROGRESS.player,
      ...(progress.player ?? {}),
    },
    lifetime: {
      ...DEFAULT_GAME_PROGRESS.lifetime,
      ...(progress.lifetime ?? {}),
    },
    daily: {
      ...DEFAULT_GAME_PROGRESS.daily,
      ...(progress.daily ?? {}),
    },
    analytics: {
      mode: {
        ...DEFAULT_GAME_PROGRESS.analytics.mode,
        ...(progress.analytics?.mode ?? {}),
      },
      questionType: {
        ...DEFAULT_GAME_PROGRESS.analytics.questionType,
        ...(progress.analytics?.questionType ?? {}),
      },
    },
    customTraining: {
      ...DEFAULT_GAME_PROGRESS.customTraining,
      ...(progress.customTraining ?? {}),
    },
    monetization: {
      ...DEFAULT_GAME_PROGRESS.monetization,
      ...(progress.monetization ?? {}),
    },
    recentSessions: Array.isArray(progress.recentSessions) ? progress.recentSessions : [],
  };
}

function normalizeProgress(progress: GameProgress): GameProgress {
  return {
    player: {
      xp: Math.max(0, Math.floor(progress.player.xp)),
      level: Math.max(1, Math.floor(progress.player.level)),
    },
    lifetime: {
      sessionsPlayed: Math.max(0, Math.floor(progress.lifetime.sessionsPlayed)),
      totalAnswers: Math.max(0, Math.floor(progress.lifetime.totalAnswers)),
      totalCorrectAnswers: Math.max(0, Math.floor(progress.lifetime.totalCorrectAnswers)),
      bestScore: Math.max(0, Math.floor(progress.lifetime.bestScore)),
      bestCombo: Math.max(0, Math.floor(progress.lifetime.bestCombo)),
      totalPlayTimeSeconds: Math.max(0, Math.floor(progress.lifetime.totalPlayTimeSeconds)),
      streakDays: Math.max(0, Math.floor(progress.lifetime.streakDays)),
      lastPlayedDate: progress.lifetime.lastPlayedDate,
    },
    daily: {
      completions: Math.max(0, Math.floor(progress.daily.completions)),
      bestScore: Math.max(0, Math.floor(progress.daily.bestScore)),
      lastCompletedDate: progress.daily.lastCompletedDate,
    },
    analytics: {
      mode: {
        custom: normalizeModeStats(progress.analytics.mode.custom),
        daily: normalizeModeStats(progress.analytics.mode.daily),
        sprint: normalizeModeStats(progress.analytics.mode.sprint),
        survival: normalizeModeStats(progress.analytics.mode.survival),
        zen: normalizeModeStats(progress.analytics.mode.zen),
      },
      questionType: {
        addition: normalizeQuestionTypeStats(progress.analytics.questionType.addition),
        subtraction: normalizeQuestionTypeStats(progress.analytics.questionType.subtraction),
        multiplication: normalizeQuestionTypeStats(progress.analytics.questionType.multiplication),
        division: normalizeQuestionTypeStats(progress.analytics.questionType.division),
      },
    },
    customTraining: {
      durationSeconds: Math.max(30, Math.floor(progress.customTraining.durationSeconds)),
      questionLimit: Math.max(5, Math.floor(progress.customTraining.questionLimit)),
      questionTypes: normalizeQuestionTypes(progress.customTraining.questionTypes),
    },
    monetization: {
      tier: progress.monetization.tier === 'premium' ? 'premium' : 'free',
      premiumActivatedAt:
        typeof progress.monetization.premiumActivatedAt === 'number'
          ? Math.floor(progress.monetization.premiumActivatedAt)
          : null,
      rewardedAdsWatched: Math.max(0, Math.floor(progress.monetization.rewardedAdsWatched)),
      rewardedXpClaimed: Math.max(0, Math.floor(progress.monetization.rewardedXpClaimed)),
      lastRewardedSessionId: progress.monetization.lastRewardedSessionId,
    },
    recentSessions: (progress.recentSessions ?? []).slice(0, RECENT_SESSION_LIMIT),
  };
}

function applyAnalyticsSummary(
  analytics: GameProgress['analytics'],
  summary: GameSessionSummary,
): GameProgress['analytics'] {
  const mode = {
    ...analytics.mode,
    [summary.mode]: {
      sessionsPlayed: analytics.mode[summary.mode].sessionsPlayed + 1,
      bestScore: Math.max(analytics.mode[summary.mode].bestScore, summary.score),
      totalScore: analytics.mode[summary.mode].totalScore + summary.score,
      totalAnswers: analytics.mode[summary.mode].totalAnswers + summary.totalAnswers,
      totalCorrectAnswers: analytics.mode[summary.mode].totalCorrectAnswers + summary.correctAnswers,
      totalDurationSeconds: analytics.mode[summary.mode].totalDurationSeconds + summary.durationSeconds,
      totalResponseTimeMs:
        analytics.mode[summary.mode].totalResponseTimeMs +
        summary.averageResponseTimeMs * summary.totalAnswers,
    },
  };

  const questionType = {
    ...analytics.questionType,
  };

  Object.entries(summary.questionTypeStats).forEach(([type, stat]) => {
    if (!stat) {
      return;
    }

    const safeType = type as keyof typeof questionType;
    const current = questionType[safeType];
    questionType[safeType] = {
      answered: current.answered + stat.answered,
      correct: current.correct + stat.correct,
      totalResponseTimeMs: current.totalResponseTimeMs + stat.averageResponseTimeMs * stat.answered,
    };
  });

  return {
    mode,
    questionType,
  };
}

function normalizeModeStats(stats: GameProgress['analytics']['mode']['daily']) {
  return {
    sessionsPlayed: Math.max(0, Math.floor(stats.sessionsPlayed)),
    bestScore: Math.max(0, Math.floor(stats.bestScore)),
    totalScore: Math.max(0, Math.floor(stats.totalScore)),
    totalAnswers: Math.max(0, Math.floor(stats.totalAnswers)),
    totalCorrectAnswers: Math.max(0, Math.floor(stats.totalCorrectAnswers)),
    totalDurationSeconds: Math.max(0, Math.floor(stats.totalDurationSeconds)),
    totalResponseTimeMs: Math.max(0, Math.floor(stats.totalResponseTimeMs)),
  };
}

function normalizeQuestionTypeStats(stats: GameProgress['analytics']['questionType']['addition']) {
  return {
    answered: Math.max(0, Math.floor(stats.answered)),
    correct: Math.max(0, Math.floor(stats.correct)),
    totalResponseTimeMs: Math.max(0, Math.floor(stats.totalResponseTimeMs)),
  };
}

function normalizeQuestionTypes(types: QuestionType[] | undefined): QuestionType[] {
  const list = Array.isArray(types) ? types : DEFAULT_GAME_PROGRESS.customTraining.questionTypes;
  const unique = Array.from(new Set<QuestionType>(list));
  return unique.length > 0 ? unique : DEFAULT_GAME_PROGRESS.customTraining.questionTypes;
}

function computeStreak(previousDate: string | null, currentDate: string, previousStreak: number): number {
  if (!previousDate) {
    return 1;
  }

  const delta = diffDays(previousDate, currentDate);

  if (delta <= 0) {
    return Math.max(1, previousStreak);
  }

  if (delta === 1) {
    return previousStreak + 1;
  }

  return 1;
}

function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function diffDays(fromDateKey: string, toDateKeyValue: string): number {
  const fromTs = Date.parse(`${fromDateKey}T00:00:00.000Z`);
  const toTs = Date.parse(`${toDateKeyValue}T00:00:00.000Z`);

  if (!Number.isFinite(fromTs) || !Number.isFinite(toTs)) {
    return 0;
  }

  return Math.floor((toTs - fromTs) / 86_400_000);
}

function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}
