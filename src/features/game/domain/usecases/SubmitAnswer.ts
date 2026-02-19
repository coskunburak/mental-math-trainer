import type { Answer } from '@features/game/domain/entities/Answer';
import type { Session } from '@features/game/domain/entities/Session';
import type { Question } from '@features/game/domain/entities/Question';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';

export interface SubmitAnswerInput {
  session: Session;
  question: Question;
  answerValue: number;
  responseTimeMs: number;
}

export interface SubmitAnswerResult {
  session: Session;
  answer: Answer;
}

export class SubmitAnswer {
  constructor(
    private readonly validator: AnswerValidator,
    private readonly scoreCalculator: ScoreCalculator,
  ) {}

  execute(input: SubmitAnswerInput): SubmitAnswerResult {
    const correct = this.validator.isCorrect(input.question, input.answerValue);
    const nextCombo = correct ? input.session.combo + 1 : 0;

    const gainedScore = this.scoreCalculator.calculate({
      isCorrect: correct,
      responseTimeMs: input.responseTimeMs,
      combo: nextCombo,
      difficultyLevel: input.session.difficultyLevel,
    });

    const nextSession: Session = {
      ...input.session,
      score: input.session.score + gainedScore,
      combo: nextCombo,
      bestCombo: Math.max(input.session.bestCombo, nextCombo),
      totalAnswers: input.session.totalAnswers + 1,
      correctAnswers: input.session.correctAnswers + (correct ? 1 : 0),
    };

    const answer: Answer = {
      questionId: input.question.id,
      questionType: input.question.type,
      value: input.answerValue,
      isCorrect: correct,
      responseTimeMs: input.responseTimeMs,
    };

    return { session: nextSession, answer };
  }
}
