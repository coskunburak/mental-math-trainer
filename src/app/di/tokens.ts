import type { EnvConfig } from '@app/config/env';
import type { Token } from '@app/di/container';
import type { AnalyticsClient } from '@core/analytics/AnalyticsClient';
import { AnalyticsService } from '@core/analytics/AnalyticsService';
import type { RewardedAdClient } from '@core/ads/RewardedAdClient';
import { RewardedAdService } from '@core/ads/RewardedAdService';
import type { RemoteConfigClient } from '@core/remoteConfig/RemoteConfigClient';
import { RemoteConfigService } from '@core/remoteConfig/RemoteConfigService';
import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { GameProgressStore } from '@features/game/data/GameProgressStore';
import { NeuroFusionProgressStore } from '@features/game/neurofusion/data/NeuroFusionProgressStore';
import type { AnswerEventRepository } from '@features/game/domain/repositories/AnswerEventRepository';
import type { BrainScoreRepository } from '@features/game/domain/repositories/BrainScoreRepository';
import type { GameProgress } from '@features/game/domain/entities/GameProgress';
import type { QuestionType } from '@features/game/domain/entities/Question';
import { BrainScoreCalculator } from '@features/game/domain/services/brain/BrainScoreCalculator';
import { InsightTextGenerator } from '@features/game/domain/services/brain/InsightTextGenerator';
import { TrendCalculator } from '@features/game/domain/services/brain/TrendCalculator';
import { WeaknessAnalyzer } from '@features/game/domain/services/brain/WeaknessAnalyzer';
import { DifficultyController } from '@features/game/domain/services/difficulty/DifficultyController';
import { QuestionGenerator } from '@features/game/domain/services/generator/QuestionGenerator';
import { ScoreCalculator } from '@features/game/domain/services/scoring/ScoreCalculator';
import { AnswerValidator } from '@features/game/domain/services/validation/AnswerValidator';
import { NeuroPassManifestAssetDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestAssetDataSource';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import { ConfigRepositoryImpl } from '@features/neuroPass/data/config/ConfigRepositoryImpl';
import { FirebaseRemoteConfigProvider } from '@features/neuroPass/data/config/FirebaseRemoteConfigProvider';
import { LocalConfigProvider } from '@features/neuroPass/data/config/LocalConfigProvider';
import { IapProductCatalog } from '@features/neuroPass/data/iap/IapProductCatalog';
import { RniapClient } from '@features/neuroPass/data/iap/RniapClient';
import { NeuroPassIapRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassIapRepositoryImpl';
import { NeuroPassManifestRemoteConfigDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestRemoteConfigDataSource';
import { ApiNeuroPassClaimsRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassClaimsRepository';
import { ApiNeuroPassEntitlementRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassEntitlementRepository';
import { ApiNeuroPassProgressRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassProgressRepository';
import { ApiNeuroPassQuestsRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassQuestsRepository';
import { ApiNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassXpLedgerRepository';
import { LocalNeuroPassClaimsRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassClaimsRepository';
import { LocalNeuroPassEntitlementRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassEntitlementRepository';
import { LocalNeuroPassProgressRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassProgressRepository';
import { LocalNeuroPassQuestsRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassQuestsRepository';
import { LocalNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassXpLedgerRepository';
import { NeuroPassRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassRepositoryImpl';
import { NeuroPassQuestsRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassQuestsRepositoryImpl';
import { NeuroPassXpLedgerRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassXpLedgerRepositoryImpl';
import type { NeuroPassSecurityConfig } from '@features/neuroPass/domain/config/NeuroPassSecurityConfig';
import { NeuroPassEntitlementPolicy } from '@features/neuroPass/domain/iap/NeuroPassEntitlementPolicy';
import { NeuroPassRetroClaimEngine } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import { NeuroPassTierSkipPolicy } from '@features/neuroPass/domain/iap/NeuroPassTierSkipPolicy';
import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';
import { NeuroPassSimulationEngine } from '@features/neuroPass/domain/economy/NeuroPassSimulationEngine';
import { NeuroPassOfferEngine } from '@features/neuroPass/domain/economy/NeuroPassOfferEngine';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { SpamTapDetector } from '@features/neuroPass/domain/antiAbuse/SpamTapDetector';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type { NeuroPassClaimsRepository } from '@features/neuroPass/domain/repositories/NeuroPassClaimsRepository';
import type { NeuroPassEntitlementRepository } from '@features/neuroPass/domain/repositories/NeuroPassEntitlementRepository';
import type { NeuroPassIapRepository } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';
import type { NeuroPassProgressRepository } from '@features/neuroPass/domain/repositories/NeuroPassProgressRepository';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';
import type { NeuroPassRepository } from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import { SeasonManifestValidator } from '@features/neuroPass/domain/services/SeasonManifestValidator';
import { ApplySeasonTransition } from '@features/neuroPass/domain/usecases/ApplySeasonTransition';
import { ClaimDailyQuestXp } from '@features/neuroPass/domain/usecases/ClaimDailyQuestXp';
import { ClaimQuestXp } from '@features/neuroPass/domain/usecases/ClaimQuestXp';
import { ClaimTierReward } from '@features/neuroPass/domain/usecases/ClaimTierReward';
import { GrantNeuroPassXpFromRun } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import { LoadNeuroPassDashboard } from '@features/neuroPass/domain/usecases/LoadNeuroPassDashboard';
import { LoadDailyQuestsForToday } from '@features/neuroPass/domain/usecases/LoadDailyQuestsForToday';
import { LoadQuestsDashboard } from '@features/neuroPass/domain/usecases/LoadQuestsDashboard';
import { PurchaseNeuroPass } from '@features/neuroPass/domain/usecases/PurchaseNeuroPass';
import { PurchaseTierSkip5 } from '@features/neuroPass/domain/usecases/PurchaseTierSkip5';
import { RestoreNeuroPassPurchases } from '@features/neuroPass/domain/usecases/RestoreNeuroPassPurchases';
import { UpdateQuestsFromRunSummary } from '@features/neuroPass/domain/usecases/UpdateQuestsFromRunSummary';
import { UseTierSkip } from '@features/neuroPass/domain/usecases/UseTierSkip';
import { NeuroPassStore } from '@features/neuroPass/presentation/store/neuroPassStore';

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
  remoteConfigClient: Symbol('remoteConfigClient') as Token<RemoteConfigClient>,
  remoteConfigService: Symbol('remoteConfigService') as Token<RemoteConfigService>,
  keyValueStore: Symbol('keyValueStore') as Token<KeyValueStore>,
  gameProgressStore: Symbol('gameProgressStore') as Token<GameProgressStore>,
  neuroFusionProgressStore: Symbol('neuroFusionProgressStore') as Token<NeuroFusionProgressStore>,
  neuroPassManifestRemoteDataSource: Symbol(
    'neuroPassManifestRemoteDataSource',
  ) as Token<NeuroPassManifestRemoteConfigDataSource>,
  neuroPassManifestAssetDataSource: Symbol(
    'neuroPassManifestAssetDataSource',
  ) as Token<NeuroPassManifestAssetDataSource>,
  neuroPassLocalStore: Symbol('neuroPassLocalStore') as Token<NeuroPassLocalStore>,
  neuroPassApiClient: Symbol('neuroPassApiClient') as Token<NeuroPassApiClient>,
  neuroPassBackendEnabled: Symbol('neuroPassBackendEnabled') as Token<boolean>,
  neuroPassSecurityConfig: Symbol('neuroPassSecurityConfig') as Token<NeuroPassSecurityConfig>,
  neuroPassLocalConfigProvider: Symbol(
    'neuroPassLocalConfigProvider',
  ) as Token<LocalConfigProvider>,
  neuroPassFirebaseConfigProvider: Symbol(
    'neuroPassFirebaseConfigProvider',
  ) as Token<FirebaseRemoteConfigProvider>,
  neuroPassConfigRepository: Symbol('neuroPassConfigRepository') as Token<ConfigRepositoryImpl>,
  neuroPassConfigProvider: Symbol('neuroPassConfigProvider') as Token<NeuroPassConfigProvider>,
  neuroPassManifestValidator: Symbol(
    'neuroPassManifestValidator',
  ) as Token<SeasonManifestValidator>,
  neuroPassRepository: Symbol('neuroPassRepository') as Token<NeuroPassRepository>,
  neuroPassRepositoryImpl: Symbol('neuroPassRepositoryImpl') as Token<NeuroPassRepositoryImpl>,
  neuroPassProgressRepository: Symbol(
    'neuroPassProgressRepository',
  ) as Token<NeuroPassProgressRepository>,
  neuroPassClaimsRepository: Symbol(
    'neuroPassClaimsRepository',
  ) as Token<NeuroPassClaimsRepository>,
  neuroPassEntitlementRepository: Symbol(
    'neuroPassEntitlementRepository',
  ) as Token<NeuroPassEntitlementRepository>,
  neuroPassLocalProgressRepository: Symbol(
    'neuroPassLocalProgressRepository',
  ) as Token<LocalNeuroPassProgressRepository>,
  neuroPassApiProgressRepository: Symbol(
    'neuroPassApiProgressRepository',
  ) as Token<ApiNeuroPassProgressRepository>,
  neuroPassLocalClaimsRepository: Symbol(
    'neuroPassLocalClaimsRepository',
  ) as Token<LocalNeuroPassClaimsRepository>,
  neuroPassApiClaimsRepository: Symbol(
    'neuroPassApiClaimsRepository',
  ) as Token<ApiNeuroPassClaimsRepository>,
  neuroPassLocalEntitlementRepository: Symbol(
    'neuroPassLocalEntitlementRepository',
  ) as Token<LocalNeuroPassEntitlementRepository>,
  neuroPassApiEntitlementRepository: Symbol(
    'neuroPassApiEntitlementRepository',
  ) as Token<ApiNeuroPassEntitlementRepository>,
  neuroPassQuestsRepository: Symbol(
    'neuroPassQuestsRepository',
  ) as Token<NeuroPassQuestsRepository>,
  neuroPassLocalQuestsRepository: Symbol(
    'neuroPassLocalQuestsRepository',
  ) as Token<LocalNeuroPassQuestsRepository>,
  neuroPassApiQuestsRepository: Symbol(
    'neuroPassApiQuestsRepository',
  ) as Token<ApiNeuroPassQuestsRepository>,
  neuroPassQuestsRepositoryImpl: Symbol(
    'neuroPassQuestsRepositoryImpl',
  ) as Token<NeuroPassQuestsRepositoryImpl>,
  neuroPassIapClient: Symbol('neuroPassIapClient') as Token<RniapClient>,
  neuroPassIapProductCatalog: Symbol('neuroPassIapProductCatalog') as Token<IapProductCatalog>,
  neuroPassIapRepository: Symbol('neuroPassIapRepository') as Token<NeuroPassIapRepository>,
  neuroPassIapRepositoryImpl: Symbol(
    'neuroPassIapRepositoryImpl',
  ) as Token<NeuroPassIapRepositoryImpl>,
  neuroPassSkuBuilder: Symbol('neuroPassSkuBuilder') as Token<NeuroPassSkuBuilder>,
  neuroPassEntitlementPolicy: Symbol(
    'neuroPassEntitlementPolicy',
  ) as Token<NeuroPassEntitlementPolicy>,
  neuroPassTierSkipPolicy: Symbol('neuroPassTierSkipPolicy') as Token<NeuroPassTierSkipPolicy>,
  neuroPassRetroClaimEngine: Symbol(
    'neuroPassRetroClaimEngine',
  ) as Token<NeuroPassRetroClaimEngine>,
  neuroPassSimulationEngine: Symbol(
    'neuroPassSimulationEngine',
  ) as Token<NeuroPassSimulationEngine>,
  neuroPassOfferEngine: Symbol('neuroPassOfferEngine') as Token<NeuroPassOfferEngine>,
  neuroPassXpLedgerRepository: Symbol(
    'neuroPassXpLedgerRepository',
  ) as Token<NeuroPassXpLedgerRepository>,
  neuroPassLocalXpLedgerRepository: Symbol(
    'neuroPassLocalXpLedgerRepository',
  ) as Token<LocalNeuroPassXpLedgerRepository>,
  neuroPassApiXpLedgerRepository: Symbol(
    'neuroPassApiXpLedgerRepository',
  ) as Token<ApiNeuroPassXpLedgerRepository>,
  neuroPassXpLedgerRepositoryImpl: Symbol(
    'neuroPassXpLedgerRepositoryImpl',
  ) as Token<NeuroPassXpLedgerRepositoryImpl>,
  neuroPassEconomyPolicy: Symbol('neuroPassEconomyPolicy') as Token<NeuroPassEconomyPolicy>,
  neuroPassSpamTapDetector: Symbol('neuroPassSpamTapDetector') as Token<SpamTapDetector>,
  neuroPassAntiAbuseGuard: Symbol('neuroPassAntiAbuseGuard') as Token<NeuroPassAntiAbuseGuard>,
  neuroPassTimeSpoofHeuristic: Symbol('neuroPassTimeSpoofHeuristic') as Token<TimeSpoofHeuristic>,
  neuroPassQuestEngine: Symbol('neuroPassQuestEngine') as Token<NeuroPassQuestEngine>,
  neuroPassApplySeasonTransition: Symbol(
    'neuroPassApplySeasonTransition',
  ) as Token<ApplySeasonTransition>,
  neuroPassLoadDashboard: Symbol('neuroPassLoadDashboard') as Token<LoadNeuroPassDashboard>,
  neuroPassGrantXpFromRun: Symbol('neuroPassGrantXpFromRun') as Token<GrantNeuroPassXpFromRun>,
  neuroPassClaimDailyQuestXp: Symbol('neuroPassClaimDailyQuestXp') as Token<ClaimDailyQuestXp>,
  neuroPassLoadDailyQuestsForToday: Symbol(
    'neuroPassLoadDailyQuestsForToday',
  ) as Token<LoadDailyQuestsForToday>,
  neuroPassLoadQuestsDashboard: Symbol(
    'neuroPassLoadQuestsDashboard',
  ) as Token<LoadQuestsDashboard>,
  neuroPassUpdateQuestsFromRunSummary: Symbol(
    'neuroPassUpdateQuestsFromRunSummary',
  ) as Token<UpdateQuestsFromRunSummary>,
  neuroPassClaimQuestXp: Symbol('neuroPassClaimQuestXp') as Token<ClaimQuestXp>,
  neuroPassClaimTierReward: Symbol('neuroPassClaimTierReward') as Token<ClaimTierReward>,
  neuroPassPurchaseNeuroPass: Symbol('neuroPassPurchaseNeuroPass') as Token<PurchaseNeuroPass>,
  neuroPassRestorePurchases: Symbol(
    'neuroPassRestorePurchases',
  ) as Token<RestoreNeuroPassPurchases>,
  neuroPassPurchaseTierSkip5: Symbol('neuroPassPurchaseTierSkip5') as Token<PurchaseTierSkip5>,
  neuroPassUseTierSkip: Symbol('neuroPassUseTierSkip') as Token<UseTierSkip>,
  neuroPassStoreFactory: Symbol('neuroPassStoreFactory') as Token<() => NeuroPassStore>,
  answerEventRepository: Symbol('answerEventRepository') as Token<AnswerEventRepository>,
  brainScoreRepository: Symbol('brainScoreRepository') as Token<BrainScoreRepository>,
  scoreCalculator: Symbol('scoreCalculator') as Token<ScoreCalculator>,
  brainScoreCalculator: Symbol('brainScoreCalculator') as Token<BrainScoreCalculator>,
  trendCalculator: Symbol('trendCalculator') as Token<TrendCalculator>,
  weaknessAnalyzer: Symbol('weaknessAnalyzer') as Token<WeaknessAnalyzer>,
  insightTextGenerator: Symbol('insightTextGenerator') as Token<InsightTextGenerator>,
  difficultyController: Symbol('difficultyController') as Token<DifficultyController>,
  answerValidator: Symbol('answerValidator') as Token<AnswerValidator>,
  questionGeneratorFactory: Symbol('questionGeneratorFactory') as Token<
    (seed: number, allowedTypes: QuestionType[]) => QuestionGenerator
  >,
} as const;
