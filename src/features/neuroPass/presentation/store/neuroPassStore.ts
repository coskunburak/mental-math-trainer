import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';
import type { NeuroPassConfig } from '@features/neuroPass/domain/config/NeuroPassConfig';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import { IapProductCatalog } from '@features/neuroPass/data/iap/IapProductCatalog';
import type {
  NeuroPassIapProduct,
  NeuroPassIapRepository,
} from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';
import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';
import type { RetroClaimResult } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import {
  DEFAULT_NEURO_PASS_INVENTORY,
  type NeuroPassInventory,
} from '@features/neuroPass/domain/entities/NeuroPassInventory';
import { PurchaseNeuroPass } from '@features/neuroPass/domain/usecases/PurchaseNeuroPass';
import { PurchaseTierSkip5 } from '@features/neuroPass/domain/usecases/PurchaseTierSkip5';
import { RestoreNeuroPassPurchases } from '@features/neuroPass/domain/usecases/RestoreNeuroPassPurchases';
import { UseTierSkip } from '@features/neuroPass/domain/usecases/UseTierSkip';
import {
  ClaimQuestXp,
  type ClaimQuestPeriod,
  type ClaimQuestXpResult,
} from '@features/neuroPass/domain/usecases/ClaimQuestXp';
import { ClaimTierReward } from '@features/neuroPass/domain/usecases/ClaimTierReward';
import {
  LoadNeuroPassDashboard,
  NEURO_PASS_DEFAULT_DASHBOARD,
} from '@features/neuroPass/domain/usecases/LoadNeuroPassDashboard';
import {
  EMPTY_QUESTS_DASHBOARD,
  type NeuroPassQuestsDashboard,
  LoadQuestsDashboard,
} from '@features/neuroPass/domain/usecases/LoadQuestsDashboard';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import type { NeuroPassClaimsRepository } from '@features/neuroPass/domain/repositories/NeuroPassClaimsRepository';
import type { NeuroPassClaimTrack } from '@features/neuroPass/domain/idempotency/keys';
import { utcDayKey } from '@features/neuroPass/domain/utils/time';
import { neuroPassQuestPeriod } from '@features/neuroPass/domain/quests/QuestTypes';
import {
  NeuroPassSimulationEngine,
  type NeuroPassSimulationInput,
  type NeuroPassSimulationReport,
} from '@features/neuroPass/domain/economy/NeuroPassSimulationEngine';
import {
  NeuroPassOfferEngine,
  type NeuroPassCatchUpOffer,
  type NeuroPassUrgencyState,
} from '@features/neuroPass/domain/economy/NeuroPassOfferEngine';

export type NeuroPassStorePhase = 'idle' | 'loading' | 'ready' | 'unavailable';

type Listener = () => void;

type PurchaseSource = 'screen_cta' | 'tier_locked' | 'sheet';

export type NeuroPassUiMessage =
  | { type: 'purchase_cancelled' }
  | { type: 'purchase_failed' }
  | { type: 'no_purchases_to_restore' }
  | { type: 'purchases_restored' }
  | { type: 'daily_limit_reached_skip5' }
  | { type: 'skip5_added' }
  | { type: 'season_already_maxed' }
  | { type: 'not_enough_skips' }
  | { type: 'used_skips'; count: number }
  | { type: 'tier_claimed'; rewardTitle: string; coinsDelta: number; totalCoins: number }
  | { type: 'tier_already_claimed' }
  | { type: 'tier_locked' }
  | { type: 'premium_required' };

export interface NeuroPassStoreState {
  phase: NeuroPassStorePhase;
  dashboard: NeuroPassDashboard;
  quests: NeuroPassQuestsDashboard;
  urgency: NeuroPassUrgencyState;
  catchUpOffer: NeuroPassCatchUpOffer;
  questsLoading: boolean;
  isRefreshing: boolean;
  isPurchaseSheetVisible: boolean;
  isPurchaseBusy: boolean;
  purchaseMessage: NeuroPassUiMessage | null;
  lastPurchaseSource: PurchaseSource;
  iapProducts: Record<string, NeuroPassIapProduct>;
  tierSkipDayCount: number;
  retroClaimResult: RetroClaimResult | null;
  retroClaimVisible: boolean;
  claimingTierKey: string | null;
  claimedRewardKeys: string[];
  inventory: NeuroPassInventory;
}

export class NeuroPassStore {
  private readonly listeners = new Set<Listener>();

  private state: NeuroPassStoreState = {
    phase: 'idle',
    dashboard: NEURO_PASS_DEFAULT_DASHBOARD,
    quests: EMPTY_QUESTS_DASHBOARD,
    urgency: {
      visible: false,
      hoursLeft: 0,
      ratioToDeadline: 0,
      label: '',
    },
    catchUpOffer: {
      visible: false,
      tiersLeft: 0,
      message: '',
    },
    questsLoading: false,
    isRefreshing: false,
    isPurchaseSheetVisible: false,
    isPurchaseBusy: false,
    purchaseMessage: null,
    lastPurchaseSource: 'screen_cta',
    iapProducts: {},
    tierSkipDayCount: 0,
    retroClaimResult: null,
    retroClaimVisible: false,
    claimingTierKey: null,
    claimedRewardKeys: [],
    inventory: DEFAULT_NEURO_PASS_INVENTORY,
  };

  private inFlightLoad: Promise<void> | null = null;
  private lastTrackedViewKey: string | null = null;

  constructor(
    private readonly loadDashboard: LoadNeuroPassDashboard,
    private readonly purchaseNeuroPass: PurchaseNeuroPass,
    private readonly restoreNeuroPassPurchases: RestoreNeuroPassPurchases,
    private readonly purchaseTierSkip5: PurchaseTierSkip5,
    private readonly useTierSkip: UseTierSkip,
    private readonly loadQuestsDashboard: LoadQuestsDashboard,
    private readonly claimQuestXp: ClaimQuestXp,
    private readonly claimTierReward: ClaimTierReward,
    private readonly configProvider: NeuroPassConfigProvider,
    private readonly simulationEngine: NeuroPassSimulationEngine,
    private readonly offerEngine: NeuroPassOfferEngine,
    private readonly localStore: NeuroPassLocalStore,
    private readonly claimsRepository: NeuroPassClaimsRepository,
    private readonly iapProductCatalog: IapProductCatalog,
    private readonly iapRepository: NeuroPassIapRepository,
    private readonly skuBuilder: NeuroPassSkuBuilder,
    private readonly analytics: AnalyticsService,
  ) {}

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): NeuroPassStoreState {
    return this.state;
  }

  async load(): Promise<void> {
    if (this.inFlightLoad) {
      return this.inFlightLoad;
    }

    this.inFlightLoad = this.loadInternal();

    try {
      await this.inFlightLoad;
    } finally {
      this.inFlightLoad = null;
    }
  }

  openPurchaseSheet(source: PurchaseSource): void {
    this.state = {
      ...this.state,
      isPurchaseSheetVisible: true,
      lastPurchaseSource: source,
      purchaseMessage: null,
    };
    this.emit();
  }

  closePurchaseSheet(): void {
    this.state = {
      ...this.state,
      isPurchaseSheetVisible: false,
    };
    this.emit();
  }

  dismissRetroClaimModal(): void {
    this.state = {
      ...this.state,
      retroClaimVisible: false,
      retroClaimResult: null,
    };
    this.emit();
  }

  clearMessage(): void {
    if (!this.state.purchaseMessage) {
      return;
    }

    this.state = {
      ...this.state,
      purchaseMessage: null,
    };
    this.emit();
  }

  getEconomyConfig(): NeuroPassConfig {
    return this.configProvider.getConfig();
  }

  runSimulation(input: NeuroPassSimulationInput): NeuroPassSimulationReport {
    return this.simulationEngine.run(input);
  }

  async purchasePass(plan: 'standard' | 'plus'): Promise<void> {
    const dashboard = this.state.dashboard;
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return;
    }

    const seasonId = dashboard.season.id;
    const sku =
      plan === 'plus'
        ? this.skuBuilder.buildPlusSku(seasonId)
        : this.skuBuilder.buildStandardSku(seasonId);

    this.state = {
      ...this.state,
      isPurchaseBusy: true,
      purchaseMessage: null,
    };
    this.emit();

    const product = this.state.iapProducts[sku];
    const result = await this.purchaseNeuroPass.execute({
      seasonId,
      plan,
      source: this.state.lastPurchaseSource,
      currentTier: dashboard.progress.currentTier,
      tiers: dashboard.tiers,
      price: product?.price ?? null,
      currency: product?.currency,
    });

    if (result.status === 'cancelled') {
      this.state = {
        ...this.state,
        isPurchaseBusy: false,
        purchaseMessage: { type: 'purchase_cancelled' },
      };
      this.emit();
      return;
    }

    if (result.status === 'failed') {
      this.state = {
        ...this.state,
        isPurchaseBusy: false,
        purchaseMessage: { type: 'purchase_failed' },
      };
      this.emit();
      return;
    }

    try {
      await this.applyRetroClaims({
        seasonId,
        effectiveTier: dashboard.effectiveTier,
        tiers: dashboard.tiers,
        retroClaim: result.retroClaim,
      });
    } catch {
      // Purchase completion should remain resilient even if retro claim grant fails.
    }
    await this.refreshDashboardFromLocal();

    this.state = {
      ...this.state,
      isPurchaseBusy: false,
      isPurchaseSheetVisible: false,
      purchaseMessage: null,
      retroClaimResult: result.retroClaim ?? null,
      retroClaimVisible: Boolean(result.retroClaim && result.retroClaim.unlockedCount > 0),
    };
    this.emit();
  }

  async restorePurchases(): Promise<void> {
    const dashboard = this.state.dashboard;
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return;
    }

    this.state = {
      ...this.state,
      isPurchaseBusy: true,
      purchaseMessage: null,
    };
    this.emit();

    const restored = await this.restoreNeuroPassPurchases.execute({
      seasonId: dashboard.season.id,
      currentTier: dashboard.progress.currentTier,
      tiers: dashboard.tiers,
    });

    try {
      await this.applyRetroClaims({
        seasonId: dashboard.season.id,
        effectiveTier: dashboard.effectiveTier,
        tiers: dashboard.tiers,
        retroClaim: restored.retroClaim,
      });
    } catch {
      // Restore should remain resilient even if retro claim grant fails.
    }
    await this.refreshDashboardFromLocal();

    if (restored.restoredSkus.length === 0) {
      this.state = {
        ...this.state,
        isPurchaseBusy: false,
        purchaseMessage: { type: 'no_purchases_to_restore' },
      };
      this.emit();
      return;
    }

    this.state = {
      ...this.state,
      isPurchaseBusy: false,
      purchaseMessage: { type: 'purchases_restored' },
      retroClaimResult: restored.retroClaim ?? null,
      retroClaimVisible: Boolean(restored.retroClaim && restored.retroClaim.unlockedCount > 0),
    };
    this.emit();
  }

  async purchaseSkip5(): Promise<void> {
    const dashboard = this.state.dashboard;
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return;
    }

    const sku = this.skuBuilder.tierSkipSku5;
    const product = this.state.iapProducts[sku];

    this.state = {
      ...this.state,
      isPurchaseBusy: true,
      purchaseMessage: null,
    };
    this.emit();

    const result = await this.purchaseTierSkip5.execute({
      seasonId: dashboard.season.id,
      price: product?.price ?? null,
      currency: product?.currency,
    });

    await this.refreshDashboardFromLocal();

    if (result.status === 'cancelled') {
      this.state = {
        ...this.state,
        isPurchaseBusy: false,
        purchaseMessage: { type: 'purchase_cancelled' },
      };
      this.emit();
      return;
    }

    if (result.status === 'failed') {
      this.state = {
        ...this.state,
        isPurchaseBusy: false,
        purchaseMessage:
          result.errorCode === 'daily_limit_reached'
            ? { type: 'daily_limit_reached_skip5' }
            : { type: 'purchase_failed' },
      };
      this.emit();
      return;
    }

    this.state = {
      ...this.state,
      isPurchaseBusy: false,
      tierSkipDayCount: result.dayCount,
      purchaseMessage: { type: 'skip5_added' },
    };
    this.emit();
  }

  async useSkip(count: number): Promise<void> {
    const dashboard = this.state.dashboard;
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return;
    }

    const result = await this.useTierSkip.execute({
      seasonId: dashboard.season.id,
      count,
      currentTierFromNxp: dashboard.progress.currentTier,
      tiersTotal: dashboard.season.tiersTotal,
    });

    if (!result.ok) {
      this.state = {
        ...this.state,
        purchaseMessage:
          result.errorCode === 'season_completed'
            ? { type: 'season_already_maxed' }
            : { type: 'not_enough_skips' },
      };
      this.emit();
      return;
    }

    await this.refreshDashboardFromLocal();

    this.state = {
      ...this.state,
      purchaseMessage: {
        type: 'used_skips',
        count: result.consumed,
      },
    };
    this.emit();
  }

  async claimQuest(period: ClaimQuestPeriod, questId: string): Promise<ClaimQuestXpResult> {
    const normalizedQuestId = questId.trim();
    if (
      (period === neuroPassQuestPeriod.daily || period === neuroPassQuestPeriod.weekly) &&
      normalizedQuestId.length === 0
    ) {
      return {
        grantedAmount: 0,
        isDuplicate: false,
        blocked: true,
        reason: 'not_found',
        period,
        questId: normalizedQuestId,
        tierBefore: this.state.dashboard.progress.currentTier,
        tierAfter: this.state.dashboard.progress.currentTier,
      };
    }

    const result = await this.claimQuestXp.execute({
      period,
      questId: normalizedQuestId,
    });

    if (result.blocked || result.isDuplicate) {
      return result;
    }

    await Promise.all([this.refreshDashboardFromLocal(), this.refreshQuests()]);

    return result;
  }

  async claimTier(tierIndex: number, track: NeuroPassClaimTrack): Promise<void> {
    const dashboard = this.state.dashboard;
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return;
    }

    const tier = dashboard.tiers.find((entry) => entry.tierIndex === tierIndex);
    if (!tier) {
      this.state = {
        ...this.state,
        purchaseMessage: { type: 'tier_locked' },
      };
      this.emit();
      return;
    }

    const claimKey = toTierTrackKey(tier.tierIndex, track);
    if (this.state.claimingTierKey === claimKey) {
      return;
    }

    this.state = {
      ...this.state,
      claimingTierKey: claimKey,
      purchaseMessage: null,
    };
    this.emit();

    try {
      const result = await this.claimTierReward.execute({
        seasonId: dashboard.season.id,
        tier,
        track,
        effectiveTier: dashboard.effectiveTier,
        premiumOwned: dashboard.entitlement.premiumOwned,
      });

      const [claimedRewardKeys, inventory] = await Promise.all([
        this.claimsRepository.getClaimedRewardKeys(),
        this.localStore.readInventory(),
      ]);

      if (result.ok) {
        this.state = {
          ...this.state,
          claimingTierKey: null,
          claimedRewardKeys,
          inventory,
          purchaseMessage: {
            type: 'tier_claimed',
            rewardTitle: result.reward?.title ?? '',
            coinsDelta:
              result.reward?.type === 'coins' ? Math.max(0, Math.floor(result.reward.amount)) : 0,
            totalCoins: inventory.coins,
          },
        };
        this.emit();
        return;
      }

      this.state = {
        ...this.state,
        claimingTierKey: null,
        claimedRewardKeys,
        inventory,
        purchaseMessage: claimBlockReasonToMessage(result.reason),
      };
      this.emit();
    } catch {
      this.state = {
        ...this.state,
        claimingTierKey: null,
        purchaseMessage: { type: 'purchase_failed' },
      };
      this.emit();
    }
  }

  private async loadInternal(): Promise<void> {
    this.state = {
      ...this.state,
      phase: this.state.dashboard.status === 'ready' ? 'ready' : 'loading',
      isRefreshing: true,
    };
    this.emit();

    const cachedFirst = await this.loadDashboard.execute({ strategy: 'cached_first' });
    this.state = {
      ...this.state,
      phase: cachedFirst.status === 'ready' ? 'ready' : 'unavailable',
      dashboard: cachedFirst,
      isRefreshing: true,
    };
    this.trackScreenView(cachedFirst);
    this.emit();

    await this.refreshQuests(true);
    await this.refreshDayCounter();
    await this.refreshIapProducts();
    await this.refreshClaimState();

    const refreshed = await this.loadDashboard.execute({ strategy: 'remote_first' });

    this.state = {
      ...this.state,
      phase: refreshed.status === 'ready' ? 'ready' : 'unavailable',
      dashboard: refreshed,
      isRefreshing: false,
    };
    this.trackScreenView(refreshed);
    this.emit();

    await this.refreshOfferState();
    await this.refreshQuests();
    await this.refreshDayCounter();
    await this.refreshIapProducts();
    await this.refreshClaimState();
  }

  private async refreshDashboardFromLocal(): Promise<void> {
    const refreshed = await this.loadDashboard.execute({ strategy: 'cached_first' });
    this.state = {
      ...this.state,
      phase: refreshed.status === 'ready' ? 'ready' : 'unavailable',
      dashboard: refreshed,
    };
    this.trackScreenView(refreshed);
    this.emit();

    await Promise.all([
      this.refreshOfferState(),
      this.refreshDayCounter(),
      this.refreshQuests(),
      this.refreshClaimState(),
    ]);
  }

  private async refreshOfferState(): Promise<void> {
    const dashboard = this.state.dashboard;
    const urgency = this.offerEngine.buildUrgencyState(dashboard);
    const catchUp = this.offerEngine.buildCatchUpOffer(dashboard);

    if (!catchUp.visible) {
      this.state = {
        ...this.state,
        urgency,
        catchUpOffer: catchUp,
      };
      this.emit();
      return;
    }

    const nowUtcIso = new Date().toISOString();
    const lastUpsellAtUtc = await this.localStore.readLastUpsellAtUtc();
    const canShow = this.offerEngine.canShowUpsellSurface({
      nowUtcIso,
      lastUpsellAtUtc,
    });

    if (canShow) {
      this.offerEngine.markUpsellShown();
      await this.localStore.writeLastUpsellAtUtc(nowUtcIso);
    }

    this.state = {
      ...this.state,
      urgency,
      catchUpOffer: canShow ? catchUp : { visible: false, tiersLeft: 0, message: '' },
    };
    this.emit();
  }

  private async refreshQuests(initialLoad = false): Promise<void> {
    if (initialLoad) {
      this.state = {
        ...this.state,
        questsLoading: true,
      };
      this.emit();
    }

    try {
      const quests = await this.loadQuestsDashboard.execute();
      this.state = {
        ...this.state,
        quests,
        questsLoading: false,
      };
      this.emit();

      this.analytics.track(neuroPassEvents.questView, {
        season_id: quests.seasonId,
        daily_key: quests.dailyKey,
        weekly_key: quests.weeklyKey,
      });
    } catch {
      this.state = {
        ...this.state,
        quests: EMPTY_QUESTS_DASHBOARD,
        questsLoading: false,
      };
      this.emit();
    }
  }

  private async refreshIapProducts(): Promise<void> {
    if (this.state.dashboard.status !== 'ready' || !this.state.dashboard.season) {
      return;
    }

    try {
      const catalog = await this.iapProductCatalog.load(this.state.dashboard.season.id);
      this.state = {
        ...this.state,
        iapProducts: catalog.products,
      };
      this.emit();
    } catch {
      // Keep placeholders on IAP catalog load failure.
    }
  }

  private async refreshDayCounter(): Promise<void> {
    const dayKey = utcDayKey(new Date());
    const dayCount = await this.iapRepository.getTierSkipDailyCounter(dayKey);
    this.state = {
      ...this.state,
      tierSkipDayCount: dayCount,
    };
    this.emit();
  }

  private async refreshClaimState(): Promise<void> {
    try {
      const [claimedRewardKeys, inventory] = await Promise.all([
        this.claimsRepository.getClaimedRewardKeys(),
        this.localStore.readInventory(),
      ]);

      this.state = {
        ...this.state,
        claimedRewardKeys,
        inventory,
      };
      this.emit();
    } catch {
      const inventory = await this.localStore.readInventory();
      this.state = {
        ...this.state,
        inventory,
      };
      this.emit();
    }
  }

  private async applyRetroClaims(input: {
    seasonId: string;
    effectiveTier: number;
    tiers: NeuroPassTier[];
    retroClaim?: RetroClaimResult;
  }): Promise<void> {
    if (!input.retroClaim || input.retroClaim.unlockedCount <= 0) {
      return;
    }

    const tierMap = new Map<number, NeuroPassTier>(
      input.tiers.map((tier) => [tier.tierIndex, tier]),
    );

    for (const tierIndex of input.retroClaim.unlockedTiers) {
      const tier = tierMap.get(tierIndex);
      if (!tier) {
        continue;
      }

      await this.claimTierReward.execute({
        seasonId: input.seasonId,
        tier,
        track: 'premium',
        effectiveTier: input.effectiveTier,
        premiumOwned: true,
      });
    }
  }

  private trackScreenView(dashboard: NeuroPassDashboard): void {
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return;
    }

    const key = `${dashboard.season.id}:${dashboard.progress.currentTier}:${dashboard.dayLeft}:${dashboard.entitlement.premiumOwned}`;
    if (key === this.lastTrackedViewKey) {
      return;
    }

    this.lastTrackedViewKey = key;

    this.analytics.track(neuroPassEvents.screenView, {
      season_id: dashboard.season.id,
      day_left: dashboard.dayLeft,
      tier: dashboard.effectiveTier,
      premium_owned: dashboard.entitlement.premiumOwned,
    });
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

function toTierTrackKey(tierIndex: number, track: NeuroPassClaimTrack): string {
  return `${Math.max(1, Math.floor(tierIndex))}:${track === 'premium' ? 'premium' : 'free'}`;
}

function claimBlockReasonToMessage(
  reason: 'tier_locked' | 'premium_required' | 'already_claimed' | 'invalid_tier' | undefined,
): NeuroPassUiMessage {
  switch (reason) {
    case 'already_claimed':
      return { type: 'tier_already_claimed' };
    case 'premium_required':
      return { type: 'premium_required' };
    case 'tier_locked':
    case 'invalid_tier':
    default:
      return { type: 'tier_locked' };
  }
}
