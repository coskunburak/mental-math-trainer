import type { GameMode } from './GameMode';
import type { QuestionType } from './Question';

export type SessionFinishReason = 'timeout' | 'manual' | 'mistake' | 'daily_complete' | 'question_limit';

export interface PlayerProgress {
  xp: number;
  level: number;
}

export interface QuestionTypeSessionStats {
  answered: number;
  correct: number;
  averageResponseTimeMs: number;
}

export type SessionQuestionTypeStats = Partial<Record<QuestionType, QuestionTypeSessionStats>>;

export interface GameSessionSummary {
  sessionId: string;
  mode: GameMode;
  questionTypes: QuestionType[];
  score: number;
  accuracyRate: number;
  correctAnswers: number;
  totalAnswers: number;
  bestCombo: number;
  durationSeconds: number;
  averageResponseTimeMs: number;
  questionTypeStats: SessionQuestionTypeStats;
  endedAt: number;
  gainedXp: number;
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  reason: SessionFinishReason;
}
