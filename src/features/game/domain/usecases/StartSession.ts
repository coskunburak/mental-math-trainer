import type { GameMode } from '@features/game/domain/entities/GameMode';
import type { QuestionType } from '@features/game/domain/entities/Question';
import type { Session } from '@features/game/domain/entities/Session';

export interface StartSessionInput {
  id: string;
  mode: GameMode;
  questionTypes: QuestionType[];
  questionLimit?: number;
  startedAt: number;
  durationSeconds: number;
  difficultyLevel: number;
}

export class StartSession {
  execute(input: StartSessionInput): Session {
    return {
      id: input.id,
      mode: input.mode,
      questionTypes: input.questionTypes,
      questionLimit: input.questionLimit,
      startedAt: input.startedAt,
      durationSeconds: input.durationSeconds,
      score: 0,
      combo: 0,
      bestCombo: 0,
      totalAnswers: 0,
      correctAnswers: 0,
      difficultyLevel: input.difficultyLevel,
    };
  }
}
