export type OperationType = 'add' | 'sub' | 'mul' | 'div' | 'mixed' | 'sequence' | 'missingNumber';

export interface AnswerEvent {
  occurredAt: string;
  operationType: OperationType;
  difficultyTier: number;
  stepCount: number;
  isCorrect: boolean;
  responseTimeMs: number;
  sessionId: string;
  questionId: string;
}
