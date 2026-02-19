import type { Question } from '@features/game/domain/entities/Question';

export class AnswerValidator {
  isCorrect(question: Question, answer: number): boolean {
    return question.answer === answer;
  }
}
