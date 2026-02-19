import type { GameMode } from '@features/game/domain/entities/GameMode';
import type { QuestionType } from '@features/game/domain/entities/Question';

export interface UnlockState {
  unlockedModes: GameMode[];
  unlockedQuestionTypes: QuestionType[];
  canUseMixedOperations: boolean;
}

export function computeUnlockState(level: number): UnlockState {
  const safeLevel = Math.max(1, Math.floor(level));

  const unlockedModes: GameMode[] = ['daily', 'sprint', 'custom'];
  if (safeLevel >= 2) {
    unlockedModes.push('zen');
  }
  if (safeLevel >= 4) {
    unlockedModes.push('survival');
  }

  const unlockedQuestionTypes: QuestionType[] = ['addition', 'subtraction'];
  if (safeLevel >= 3) {
    unlockedQuestionTypes.push('multiplication');
  }
  if (safeLevel >= 5) {
    unlockedQuestionTypes.push('division');
  }

  return {
    unlockedModes,
    unlockedQuestionTypes,
    canUseMixedOperations: unlockedQuestionTypes.length > 2,
  };
}

export function isModeUnlocked(level: number, mode: GameMode): boolean {
  return computeUnlockState(level).unlockedModes.includes(mode);
}
