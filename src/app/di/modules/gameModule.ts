import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { AnswerEventStore } from '@features/game/data/AnswerEventStore';
import { BrainScoreStore } from '@features/game/data/BrainScoreStore';
import { GameProgressStore } from '@features/game/data/GameProgressStore';
import { NeuroFusionProgressStore } from '@features/game/neurofusion/data/NeuroFusionProgressStore';
import type { QuestionType } from '@features/game/domain/entities/Question';
import { BrainScoreCalculator } from '@features/game/domain/services/brain/BrainScoreCalculator';
import { InsightTextGenerator } from '@features/game/domain/services/brain/InsightTextGenerator';
import { TrendCalculator } from '@features/game/domain/services/brain/TrendCalculator';
import { WeaknessAnalyzer } from '@features/game/domain/services/brain/WeaknessAnalyzer';
import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';
import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';

export function registerGameModule(container: Container): void {
  container.registerSingleton(
    TOKENS.gameProgressStore,
    (c) => new GameProgressStore(c.resolve(TOKENS.keyValueStore), c.resolve(TOKENS.analyticsService)),
  );
  container.registerSingleton(
    TOKENS.neuroFusionProgressStore,
    (c) => new NeuroFusionProgressStore(c.resolve(TOKENS.keyValueStore)),
  );
  container.registerSingleton(TOKENS.answerEventRepository, (c) => new AnswerEventStore(c.resolve(TOKENS.keyValueStore)));
  container.registerSingleton(TOKENS.brainScoreRepository, (c) => new BrainScoreStore(c.resolve(TOKENS.keyValueStore)));
  container.registerSingleton(TOKENS.scoreCalculator, () => new ScoreCalculator());
  container.registerSingleton(TOKENS.brainScoreCalculator, () => new BrainScoreCalculator());
  container.registerSingleton(
    TOKENS.trendCalculator,
    (c) => new TrendCalculator(c.resolve(TOKENS.brainScoreCalculator)),
  );
  container.registerSingleton(
    TOKENS.weaknessAnalyzer,
    (c) => new WeaknessAnalyzer(c.resolve(TOKENS.brainScoreCalculator)),
  );
  container.registerSingleton(TOKENS.insightTextGenerator, () => new InsightTextGenerator());
  container.registerSingleton(TOKENS.difficultyController, () => new DifficultyController());
  container.registerSingleton(TOKENS.answerValidator, () => new AnswerValidator());
  container.registerFactory(
    TOKENS.questionGeneratorFactory,
    () => (seed: number, allowedTypes: QuestionType[]) => new QuestionGenerator({ seed, allowedTypes }),
  );
}
