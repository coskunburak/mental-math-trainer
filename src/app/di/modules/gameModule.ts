import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { GameProgressStore } from '@features/game/data/GameProgressStore';
import type { QuestionType } from '@features/game/domain/entities/Question';
import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';
import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';

export function registerGameModule(container: Container): void {
  container.registerSingleton(
    TOKENS.gameProgressStore,
    (c) => new GameProgressStore(c.resolve(TOKENS.keyValueStore), c.resolve(TOKENS.analyticsService)),
  );
  container.registerSingleton(TOKENS.scoreCalculator, () => new ScoreCalculator());
  container.registerSingleton(TOKENS.difficultyController, () => new DifficultyController());
  container.registerSingleton(TOKENS.answerValidator, () => new AnswerValidator());
  container.registerFactory(
    TOKENS.questionGeneratorFactory,
    () => (seed: number, allowedTypes: QuestionType[]) => new QuestionGenerator({ seed, allowedTypes }),
  );
}
