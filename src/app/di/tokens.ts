import type { EnvConfig } from '@app/config/env';
import type { Token } from '@app/di/container';
import type { AnalyticsClient } from '@core/analytics/AnalyticsClient';
import { AnalyticsService } from '@core/analytics/AnalyticsService';
import type { RewardedAdClient } from '@core/ads/RewardedAdClient';
import { RewardedAdService } from '@core/ads/RewardedAdService';
import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { GameProgressStore } from '@features/game/data/GameProgressStore';
import type { GameProgress } from '@features/game/domain/entities/GameProgress';
import type { QuestionType } from '@features/game/domain/entities/Question';
import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';
import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';

export interface BootstrapState {
  initialGameProgress: GameProgress | null;
}

export const TOKENS = {
  env: Symbol('env') as Token<EnvConfig>,
  bootstrapState: Symbol('bootstrapState') as Token<BootstrapState>,
  analyticsClient: Symbol('analyticsClient') as Token<AnalyticsClient>,
  analyticsService: Symbol('analyticsService') as Token<AnalyticsService>,
  rewardedAdClient: Symbol('rewardedAdClient') as Token<RewardedAdClient>,
  rewardedAdService: Symbol('rewardedAdService') as Token<RewardedAdService>,
  keyValueStore: Symbol('keyValueStore') as Token<KeyValueStore>,
  gameProgressStore: Symbol('gameProgressStore') as Token<GameProgressStore>,
  scoreCalculator: Symbol('scoreCalculator') as Token<ScoreCalculator>,
  difficultyController: Symbol('difficultyController') as Token<DifficultyController>,
  answerValidator: Symbol('answerValidator') as Token<AnswerValidator>,
  questionGeneratorFactory: Symbol('questionGeneratorFactory') as Token<
    (seed: number, allowedTypes: QuestionType[]) => QuestionGenerator
  >,
} as const;
