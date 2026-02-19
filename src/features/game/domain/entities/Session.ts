import type { GameMode } from './GameMode';
import type { QuestionType } from './Question';

export interface Session {
  id: string;
  mode: GameMode;
  questionTypes: QuestionType[];
  questionLimit?: number;
  startedAt: number;
  durationSeconds: number;
  endedAt?: number;
  score: number;
  combo: number;
  bestCombo: number;
  totalAnswers: number;
  correctAnswers: number;
  difficultyLevel: number;
}
