export type QuestionType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  operands: [number, number];
  answer: number;
  difficultyLevel: number;
  createdAt: number;
}
