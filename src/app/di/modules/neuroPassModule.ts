import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { NoopRemoteConfigClient } from '@core/remoteConfig/RemoteConfigClient';
import { RemoteConfigService } from '@core/remoteConfig/RemoteConfigService';
import { StubNeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import { ConfigRepositoryImpl } from '@features/neuroPass/data/config/ConfigRepositoryImpl';
import { FirebaseRemoteConfigProvider } from '@features/neuroPass/data/config/FirebaseRemoteConfigProvider';
import { LocalConfigProvider } from '@features/neuroPass/data/config/LocalConfigProvider';
import { NeuroPassManifestAssetDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestAssetDataSource';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import { NeuroPassManifestRemoteConfigDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestRemoteConfigDataSource';
import { IapProductCatalog } from '@features/neuroPass/data/iap/IapProductCatalog';
import { RniapClient } from '@features/neuroPass/data/iap/RniapClient';
import { ApiNeuroPassClaimsRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassClaimsRepository';
import { ApiNeuroPassEntitlementRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassEntitlementRepository';
import { ApiNeuroPassProgressRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassProgressRepository';
import { ApiNeuroPassQuestsRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassQuestsRepository';
import { ApiNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassXpLedgerRepository';
import { NeuroPassIapRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassIapRepositoryImpl';
import { LocalNeuroPassClaimsRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassClaimsRepository';
import { LocalNeuroPassEntitlementRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassEntitlementRepository';
import { LocalNeuroPassProgressRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassProgressRepository';
import { LocalNeuroPassQuestsRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassQuestsRepository';
import { LocalNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassXpLedgerRepository';
import { NeuroPassRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassRepositoryImpl';
import { NeuroPassQuestsRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassQuestsRepositoryImpl';
import { NeuroPassXpLedgerRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassXpLedgerRepositoryImpl';
import { NeuroPassEntitlementPolicy } from '@features/neuroPass/domain/iap/NeuroPassEntitlementPolicy';
import { NeuroPassRetroClaimEngine } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import { NeuroPassTierSkipPolicy } from '@features/neuroPass/domain/iap/NeuroPassTierSkipPolicy';
import {
  DEFAULT_NEURO_PASS_SECURITY_CONFIG,
  type NeuroPassSecurityConfig,
} from '@features/neuroPass/domain/config/NeuroPassSecurityConfig';
import { NeuroPassSimulationEngine } from '@features/neuroPass/domain/economy/NeuroPassSimulationEngine';
import { NeuroPassOfferEngine } from '@features/neuroPass/domain/economy/NeuroPassOfferEngine';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import { SpamTapDetector } from '@features/neuroPass/domain/antiAbuse/SpamTapDetector';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
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

export interface RegisterNeuroPassModuleOptions {
  backendEnabled?: boolean;
  securityConfig?: Partial<NeuroPassSecurityConfig>;
}

export function registerNeuroPassModule(
  container: Container,
  options?: RegisterNeuroPassModuleOptions,
): void {
  const backendEnabled = options?.backendEnabled ?? false;
  const securityConfig: NeuroPassSecurityConfig = {
    ...DEFAULT_NEURO_PASS_SECURITY_CONFIG,
    ...(options?.securityConfig ?? {}),
  };

  container.registerSingleton(TOKENS.neuroPassBackendEnabled, () => backendEnabled);
  container.registerSingleton(TOKENS.neuroPassSecurityConfig, () => securityConfig);

  container.registerSingleton(TOKENS.remoteConfigClient, () => new NoopRemoteConfigClient());
  container.registerSingleton(
    TOKENS.remoteConfigService,
    (c) => new RemoteConfigService(c.resolve(TOKENS.remoteConfigClient)),
  );

  container.registerSingleton(TOKENS.neuroPassApiClient, () => new StubNeuroPassApiClient());

  container.registerSingleton(TOKENS.neuroPassLocalConfigProvider, () => new LocalConfigProvider());
  container.registerSingleton(
    TOKENS.neuroPassFirebaseConfigProvider,
    (c) => new FirebaseRemoteConfigProvider(c.resolve(TOKENS.remoteConfigService)),
  );
  container.registerSingleton(
    TOKENS.neuroPassConfigRepository,
    (c) =>
      new ConfigRepositoryImpl(
        c.resolve(TOKENS.neuroPassFirebaseConfigProvider),
        c.resolve(TOKENS.neuroPassLocalConfigProvider),
      ),
  );
  container.registerSingleton(TOKENS.neuroPassConfigProvider, (c) =>
    c.resolve(TOKENS.neuroPassConfigRepository),
  );

  container.registerSingleton(
    TOKENS.neuroPassManifestRemoteDataSource,
    (c) =>
      new NeuroPassManifestRemoteConfigDataSource(
        c.resolve(TOKENS.remoteConfigService),
        c.resolve(TOKENS.neuroPassConfigProvider),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassManifestAssetDataSource,
    () => new NeuroPassManifestAssetDataSource(),
  );
  container.registerSingleton(
    TOKENS.neuroPassLocalStore,
    (c) => new NeuroPassLocalStore(c.resolve(TOKENS.keyValueStore)),
  );
  container.registerSingleton(
    TOKENS.neuroPassManifestValidator,
    () => new SeasonManifestValidator(),
  );

  container.registerSingleton(
    TOKENS.neuroPassRepositoryImpl,
    (c) =>
      new NeuroPassRepositoryImpl(
        c.resolve(TOKENS.neuroPassManifestRemoteDataSource),
        c.resolve(TOKENS.neuroPassManifestAssetDataSource),
        c.resolve(TOKENS.neuroPassLocalStore),
      ),
  );
  container.registerSingleton(TOKENS.neuroPassRepository, (c) =>
    c.resolve(TOKENS.neuroPassRepositoryImpl),
  );

  container.registerSingleton(
    TOKENS.neuroPassLocalProgressRepository,
    (c) => new LocalNeuroPassProgressRepository(c.resolve(TOKENS.neuroPassLocalStore)),
  );
  container.registerSingleton(
    TOKENS.neuroPassApiProgressRepository,
    (c) => new ApiNeuroPassProgressRepository(c.resolve(TOKENS.neuroPassApiClient)),
  );
  container.registerSingleton(TOKENS.neuroPassProgressRepository, (c) =>
    backendEnabled
      ? c.resolve(TOKENS.neuroPassApiProgressRepository)
      : c.resolve(TOKENS.neuroPassLocalProgressRepository),
  );

  container.registerSingleton(
    TOKENS.neuroPassLocalClaimsRepository,
    (c) => new LocalNeuroPassClaimsRepository(c.resolve(TOKENS.neuroPassLocalStore)),
  );
  container.registerSingleton(
    TOKENS.neuroPassApiClaimsRepository,
    (c) => new ApiNeuroPassClaimsRepository(c.resolve(TOKENS.neuroPassApiClient)),
  );
  container.registerSingleton(TOKENS.neuroPassClaimsRepository, (c) =>
    backendEnabled
      ? c.resolve(TOKENS.neuroPassApiClaimsRepository)
      : c.resolve(TOKENS.neuroPassLocalClaimsRepository),
  );

  container.registerSingleton(
    TOKENS.neuroPassLocalEntitlementRepository,
    (c) => new LocalNeuroPassEntitlementRepository(c.resolve(TOKENS.neuroPassLocalStore)),
  );
  container.registerSingleton(
    TOKENS.neuroPassApiEntitlementRepository,
    (c) => new ApiNeuroPassEntitlementRepository(c.resolve(TOKENS.neuroPassApiClient)),
  );
  container.registerSingleton(TOKENS.neuroPassEntitlementRepository, (c) =>
    backendEnabled
      ? c.resolve(TOKENS.neuroPassApiEntitlementRepository)
      : c.resolve(TOKENS.neuroPassLocalEntitlementRepository),
  );

  container.registerSingleton(
    TOKENS.neuroPassLocalQuestsRepository,
    (c) => new LocalNeuroPassQuestsRepository(c.resolve(TOKENS.neuroPassLocalStore)),
  );
  container.registerSingleton(
    TOKENS.neuroPassApiQuestsRepository,
    (c) => new ApiNeuroPassQuestsRepository(c.resolve(TOKENS.neuroPassApiClient)),
  );
  container.registerSingleton(
    TOKENS.neuroPassQuestsRepositoryImpl,
    (c) => new NeuroPassQuestsRepositoryImpl(c.resolve(TOKENS.neuroPassLocalStore)),
  );
  container.registerSingleton(TOKENS.neuroPassQuestsRepository, (c) =>
    backendEnabled
      ? c.resolve(TOKENS.neuroPassApiQuestsRepository)
      : c.resolve(TOKENS.neuroPassLocalQuestsRepository),
  );

  container.registerSingleton(
    TOKENS.neuroPassLocalXpLedgerRepository,
    (c) =>
      new LocalNeuroPassXpLedgerRepository(
        c.resolve(TOKENS.neuroPassLocalStore),
        () => Date.now(),
        c.resolve(TOKENS.neuroPassSecurityConfig).replayIndexLookbackDays,
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassApiXpLedgerRepository,
    (c) => new ApiNeuroPassXpLedgerRepository(c.resolve(TOKENS.neuroPassApiClient)),
  );
  container.registerSingleton(
    TOKENS.neuroPassXpLedgerRepositoryImpl,
    (c) =>
      new NeuroPassXpLedgerRepositoryImpl(
        c.resolve(TOKENS.neuroPassLocalStore),
        () => Date.now(),
        c.resolve(TOKENS.neuroPassSecurityConfig).replayIndexLookbackDays,
      ),
  );
  container.registerSingleton(TOKENS.neuroPassXpLedgerRepository, (c) =>
    backendEnabled
      ? c.resolve(TOKENS.neuroPassApiXpLedgerRepository)
      : c.resolve(TOKENS.neuroPassLocalXpLedgerRepository),
  );

  container.registerSingleton(TOKENS.neuroPassSkuBuilder, () => new NeuroPassSkuBuilder());
  container.registerSingleton(TOKENS.neuroPassIapClient, () => new RniapClient());
  container.registerSingleton(
    TOKENS.neuroPassIapRepositoryImpl,
    (c) =>
      new NeuroPassIapRepositoryImpl(
        c.resolve(TOKENS.neuroPassLocalStore),
        c.resolve(TOKENS.neuroPassIapClient),
      ),
  );
  container.registerSingleton(TOKENS.neuroPassIapRepository, (c) =>
    c.resolve(TOKENS.neuroPassIapRepositoryImpl),
  );
  container.registerSingleton(
    TOKENS.neuroPassIapProductCatalog,
    (c) =>
      new IapProductCatalog(
        c.resolve(TOKENS.neuroPassIapClient),
        c.resolve(TOKENS.neuroPassSkuBuilder),
      ),
  );

  container.registerSingleton(
    TOKENS.neuroPassEconomyPolicy,
    (c) => new NeuroPassEconomyPolicy(c.resolve(TOKENS.neuroPassConfigProvider)),
  );
  container.registerSingleton(
    TOKENS.neuroPassSimulationEngine,
    (c) => new NeuroPassSimulationEngine(c.resolve(TOKENS.neuroPassEconomyPolicy)),
  );
  container.registerSingleton(TOKENS.neuroPassOfferEngine, () => new NeuroPassOfferEngine());
  container.registerSingleton(TOKENS.neuroPassSpamTapDetector, () => new SpamTapDetector());
  container.registerSingleton(
    TOKENS.neuroPassAntiAbuseGuard,
    (c) => new NeuroPassAntiAbuseGuard(c.resolve(TOKENS.neuroPassSpamTapDetector)),
  );
  container.registerSingleton(TOKENS.neuroPassTimeSpoofHeuristic, () => new TimeSpoofHeuristic());
  container.registerSingleton(TOKENS.neuroPassQuestEngine, () => new NeuroPassQuestEngine());
  container.registerSingleton(
    TOKENS.neuroPassEntitlementPolicy,
    (c) => new NeuroPassEntitlementPolicy(c.resolve(TOKENS.neuroPassSkuBuilder)),
  );
  container.registerSingleton(TOKENS.neuroPassTierSkipPolicy, () => new NeuroPassTierSkipPolicy());
  container.registerSingleton(
    TOKENS.neuroPassRetroClaimEngine,
    () => new NeuroPassRetroClaimEngine(),
  );

  container.registerSingleton(
    TOKENS.neuroPassApplySeasonTransition,
    () => new ApplySeasonTransition(),
  );
  container.registerSingleton(
    TOKENS.neuroPassLoadDashboard,
    (c) =>
      new LoadNeuroPassDashboard(
        c.resolve(TOKENS.neuroPassRepository),
        c.resolve(TOKENS.neuroPassManifestValidator),
        c.resolve(TOKENS.neuroPassApplySeasonTransition),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassGrantXpFromRun,
    (c) =>
      new GrantNeuroPassXpFromRun(
        c.resolve(TOKENS.neuroPassProgressRepository),
        c.resolve(TOKENS.neuroPassXpLedgerRepository),
        c.resolve(TOKENS.neuroPassEconomyPolicy),
        c.resolve(TOKENS.neuroPassAntiAbuseGuard),
        c.resolve(TOKENS.neuroPassTimeSpoofHeuristic),
        c.resolve(TOKENS.neuroPassSecurityConfig),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassClaimDailyQuestXp,
    (c) =>
      new ClaimDailyQuestXp(
        c.resolve(TOKENS.neuroPassRepository),
        c.resolve(TOKENS.neuroPassXpLedgerRepository),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassLoadDailyQuestsForToday,
    (c) => new LoadDailyQuestsForToday(c.resolve(TOKENS.neuroPassXpLedgerRepository)),
  );
  container.registerSingleton(
    TOKENS.neuroPassLoadQuestsDashboard,
    (c) =>
      new LoadQuestsDashboard(
        c.resolve(TOKENS.neuroPassQuestsRepository),
        c.resolve(TOKENS.neuroPassRepository),
        c.resolve(TOKENS.neuroPassQuestEngine),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassUpdateQuestsFromRunSummary,
    (c) =>
      new UpdateQuestsFromRunSummary(
        c.resolve(TOKENS.neuroPassQuestsRepository),
        c.resolve(TOKENS.neuroPassRepository),
        c.resolve(TOKENS.neuroPassXpLedgerRepository),
        c.resolve(TOKENS.neuroPassQuestEngine),
        c.resolve(TOKENS.neuroPassAntiAbuseGuard),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassClaimQuestXp,
    (c) =>
      new ClaimQuestXp(
        c.resolve(TOKENS.neuroPassQuestsRepository),
        c.resolve(TOKENS.neuroPassRepository),
        c.resolve(TOKENS.neuroPassXpLedgerRepository),
        c.resolve(TOKENS.neuroPassQuestEngine),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassClaimTierReward,
    (c) =>
      new ClaimTierReward(
        c.resolve(TOKENS.neuroPassClaimsRepository),
        c.resolve(TOKENS.neuroPassLocalStore),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassPurchaseNeuroPass,
    (c) =>
      new PurchaseNeuroPass(
        c.resolve(TOKENS.neuroPassIapRepository),
        c.resolve(TOKENS.neuroPassEntitlementPolicy),
        c.resolve(TOKENS.neuroPassRetroClaimEngine),
        c.resolve(TOKENS.neuroPassSkuBuilder),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassRestorePurchases,
    (c) =>
      new RestoreNeuroPassPurchases(
        c.resolve(TOKENS.neuroPassIapRepository),
        c.resolve(TOKENS.neuroPassEntitlementPolicy),
        c.resolve(TOKENS.neuroPassRetroClaimEngine),
        c.resolve(TOKENS.neuroPassSkuBuilder),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassPurchaseTierSkip5,
    (c) =>
      new PurchaseTierSkip5(
        c.resolve(TOKENS.neuroPassIapRepository),
        c.resolve(TOKENS.neuroPassTierSkipPolicy),
        c.resolve(TOKENS.neuroPassSkuBuilder),
        c.resolve(TOKENS.analyticsService),
      ),
  );
  container.registerSingleton(
    TOKENS.neuroPassUseTierSkip,
    (c) =>
      new UseTierSkip(
        c.resolve(TOKENS.neuroPassIapRepository),
        c.resolve(TOKENS.neuroPassTierSkipPolicy),
        c.resolve(TOKENS.analyticsService),
      ),
  );

  container.registerFactory(
    TOKENS.neuroPassStoreFactory,
    (c) => () =>
      new NeuroPassStore(
        c.resolve(TOKENS.neuroPassLoadDashboard),
        c.resolve(TOKENS.neuroPassPurchaseNeuroPass),
        c.resolve(TOKENS.neuroPassRestorePurchases),
        c.resolve(TOKENS.neuroPassPurchaseTierSkip5),
        c.resolve(TOKENS.neuroPassUseTierSkip),
        c.resolve(TOKENS.neuroPassLoadQuestsDashboard),
        c.resolve(TOKENS.neuroPassClaimQuestXp),
        c.resolve(TOKENS.neuroPassClaimTierReward),
        c.resolve(TOKENS.neuroPassConfigProvider),
        c.resolve(TOKENS.neuroPassSimulationEngine),
        c.resolve(TOKENS.neuroPassOfferEngine),
        c.resolve(TOKENS.neuroPassLocalStore),
        c.resolve(TOKENS.neuroPassClaimsRepository),
        c.resolve(TOKENS.neuroPassIapProductCatalog),
        c.resolve(TOKENS.neuroPassIapRepository),
        c.resolve(TOKENS.neuroPassSkuBuilder),
        c.resolve(TOKENS.analyticsService),
      ),
  );
}
