import type { GameProgress } from '@features/game/domain/entities/GameProgress';
import type { QuestionType } from '@features/game/domain/entities/Question';
import { computeUnlockState } from '@features/game/domain/services/unlocks/Unlocks';

const DAILY_DURATION_SECONDS = 90;
const DAILY_QUESTION_LIMIT = 12;

export interface DailyChallengePlan {
  dateKey: string;
  seed: number;
  durationSeconds: number;
  questionLimit: number;
  questionTypes: QuestionType[];
}

export function buildDailyChallengePlan(level: number, now = Date.now()): DailyChallengePlan {
  const dateKey = toLocalDateKey(now);
  const unlocks = computeUnlockState(level);

  return {
    dateKey,
    seed: buildDailySeed(dateKey),
    durationSeconds: DAILY_DURATION_SECONDS,
    questionLimit: DAILY_QUESTION_LIMIT,
    questionTypes: unlocks.unlockedQuestionTypes,
  };
}

export function isDailyChallengeCompletedToday(progress: GameProgress, now = Date.now()): boolean {
  const today = toLocalDateKey(now);
  return progress.daily.lastCompletedDate === today;
}

export function toLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDailySeed(dateKey: string): number {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}
