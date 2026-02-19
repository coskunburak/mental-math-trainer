import type { QuestionType } from './Question';

export interface Answer {
  questionId: string;
  questionType: QuestionType;
  value: number;
  isCorrect: boolean;
  responseTimeMs: number;
}
