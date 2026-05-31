import type { GameSessionSummary, PlayerProgress } from './ProgressModels';
import type { GameMode } from './GameMode';
import type { MonetizationProfile } from './Monetization';
import type { QuestionType } from './Question';

export interface GameLifetimeStats {
  sessionsPlayed: number;
  totalAnswers: number;
  totalCorrectAnswers: number;
  bestScore: number;
  bestCombo: number;
  totalPlayTimeSeconds: number;
  streakDays: number;
  lastPlayedDate: string | null;
}

export interface GameDailyChallengeStats {
  completions: number;
  bestScore: number;
  lastCompletedDate: string | null;
}

export interface ModeAggregateStats {
  sessionsPlayed: number;
  bestScore: number;
  totalScore: number;
  totalAnswers: number;
  totalCorrectAnswers: number;
  totalDurationSeconds: number;
  totalResponseTimeMs: number;
}

export interface QuestionTypeAggregateStats {
  answered: number;
  correct: number;
  totalResponseTimeMs: number;
}

export interface GameAnalyticsStats {
  mode: Record<GameMode, ModeAggregateStats>;
  questionType: Record<QuestionType, QuestionTypeAggregateStats>;
}

export interface CustomTrainingSettings {
  durationSeconds: number;
  questionLimit: number;
  questionTypes: QuestionType[];
}

export interface GameProgress {
  player: PlayerProgress;
  lifetime: GameLifetimeStats;
  daily: GameDailyChallengeStats;
  analytics: GameAnalyticsStats;
  customTraining: CustomTrainingSettings;
  monetization: MonetizationProfile;
  recentSessions: GameSessionSummary[];
}

export const RECENT_SESSION_LIMIT = 12;

export const DEFAULT_GAME_PROGRESS: GameProgress = {
  player: {
    xp: 0,
    level: 1,
  },
  lifetime: {
    sessionsPlayed: 0,
    totalAnswers: 0,
    totalCorrectAnswers: 0,
    bestScore: 0,
    bestCombo: 0,
    totalPlayTimeSeconds: 0,
    streakDays: 0,
    lastPlayedDate: null,
  },
  daily: {
    completions: 0,
    bestScore: 0,
    lastCompletedDate: null,
  },
  analytics: {
    mode: {
      custom: {
        sessionsPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        totalAnswers: 0,
        totalCorrectAnswers: 0,
        totalDurationSeconds: 0,
        totalResponseTimeMs: 0,
      },
      daily: {
        sessionsPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        totalAnswers: 0,
        totalCorrectAnswers: 0,
        totalDurationSeconds: 0,
        totalResponseTimeMs: 0,
      },
      sprint: {
        sessionsPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        totalAnswers: 0,
        totalCorrectAnswers: 0,
        totalDurationSeconds: 0,
        totalResponseTimeMs: 0,
      },
      survival: {
        sessionsPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        totalAnswers: 0,
        totalCorrectAnswers: 0,
        totalDurationSeconds: 0,
        totalResponseTimeMs: 0,
      },
      zen: {
        sessionsPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        totalAnswers: 0,
        totalCorrectAnswers: 0,
        totalDurationSeconds: 0,
        totalResponseTimeMs: 0,
      },
      neuro_fusion: {
        sessionsPlayed: 0,
        bestScore: 0,
        totalScore: 0,
        totalAnswers: 0,
        totalCorrectAnswers: 0,
        totalDurationSeconds: 0,
        totalResponseTimeMs: 0,
      },
    },
    questionType: {
      addition: {
        answered: 0,
        correct: 0,
        totalResponseTimeMs: 0,
      },
      subtraction: {
        answered: 0,
        correct: 0,
        totalResponseTimeMs: 0,
      },
      multiplication: {
        answered: 0,
        correct: 0,
        totalResponseTimeMs: 0,
      },
      division: {
        answered: 0,
        correct: 0,
        totalResponseTimeMs: 0,
      },
    },
  },
  customTraining: {
    durationSeconds: 120,
    questionLimit: 20,
    questionTypes: ['addition', 'subtraction'],
  },
  monetization: {
    tier: 'free',
    premiumActivatedAt: null,
    rewardedAdsWatched: 0,
    rewardedXpClaimed: 0,
    lastRewardedSessionId: null,
  },
  recentSessions: [],
};
