import { AnalyticsService } from '@core/analytics/AnalyticsService';
import type { AnalyticsClient, AnalyticsParams } from '@core/analytics/AnalyticsClient';
import type {
  NeuroPassClaimPlaceholderModel,
  NeuroPassPersistedEntitlementModel,
  NeuroPassPersistedProgressModel,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassTimeHeuristicState } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type {
  ManifestCandidate,
  ManifestLoadStrategy,
  NeuroPassRepository,
} from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import { buildDefaultNeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';
import type { NeuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';
import { getTodayUtcRange, isInUtcRange } from '@features/neuroPass/domain/utils/time';

export class InMemoryNeuroPassRepository implements NeuroPassRepository {
  manifestCandidates: ManifestCandidate[] = [];
  progress: NeuroPassPersistedProgressModel = {
    currentNxp: 0,
    lastUpdatedAtUtc: '2026-01-01T00:00:00.000Z',
  };
  entitlement: NeuroPassPersistedEntitlementModel = {
    seasonId: 'neuro_pass_s1',
    premiumOwned: false,
    passSkuPurchased: null,
    plusTierSkipsRemaining: 0,
    purchasedTierSkipsBalance: 0,
    tierSkipsPurchasedTodayCount: 0,
    bonusUnlockedTiers: 0,
    purchasedSkus: [],
  };
  claimPlaceholder: NeuroPassClaimPlaceholderModel = {
    claimedRewardKeys: [],
  };
  lastSeenSeasonId: string | null = 'neuro_pass_s1';
  lastAppliedSeasonState: NeuroPassSeasonState | null = 'active';
  timeHeuristicState: NeuroPassTimeHeuristicState = {
    suspiciousTime: false,
    stableSamples: 0,
  };

  async getManifestCandidates(_strategy: ManifestLoadStrategy): Promise<ManifestCandidate[]> {
    return this.manifestCandidates;
  }

  async saveCachedManifest(_rawJson: string): Promise<void> {
    // No-op for tests.
  }

  async readProgress(): Promise<NeuroPassPersistedProgressModel> {
    return this.progress;
  }

  async writeProgress(progress: NeuroPassPersistedProgressModel): Promise<void> {
    this.progress = progress;
  }

  async readEntitlement(): Promise<NeuroPassPersistedEntitlementModel> {
    return this.entitlement;
  }

  async writeEntitlement(entitlement: NeuroPassPersistedEntitlementModel): Promise<void> {
    this.entitlement = entitlement;
  }

  async readEntitlementForSeason(_seasonId: string): Promise<NeuroPassPersistedEntitlementModel> {
    return this.entitlement;
  }

  async writeEntitlementForSeason(
    _seasonId: string,
    entitlement: NeuroPassPersistedEntitlementModel,
  ): Promise<void> {
    this.entitlement = entitlement;
  }

  async readClaimPlaceholder(): Promise<NeuroPassClaimPlaceholderModel> {
    return this.claimPlaceholder;
  }

  async writeClaimPlaceholder(claimState: NeuroPassClaimPlaceholderModel): Promise<void> {
    this.claimPlaceholder = claimState;
  }

  async getClaimedRewardKeys(): Promise<string[]> {
    return [...this.claimPlaceholder.claimedRewardKeys];
  }

  async setClaimedRewardKeys(keys: string[]): Promise<void> {
    this.claimPlaceholder = {
      ...this.claimPlaceholder,
      claimedRewardKeys: [...keys],
    };
  }

  async hasClaimKey(key: string): Promise<boolean> {
    return this.claimPlaceholder.claimedRewardKeys.includes(key);
  }

  async addClaimKey(key: string): Promise<void> {
    if (this.claimPlaceholder.claimedRewardKeys.includes(key)) {
      return;
    }

    this.claimPlaceholder = {
      ...this.claimPlaceholder,
      claimedRewardKeys: [...this.claimPlaceholder.claimedRewardKeys, key],
    };
  }

  async readLastSeenSeasonId(): Promise<string | null> {
    return this.lastSeenSeasonId;
  }

  async writeLastSeenSeasonId(seasonId: string): Promise<void> {
    this.lastSeenSeasonId = seasonId;
  }

  async readLastAppliedSeasonState(): Promise<NeuroPassSeasonState | null> {
    return this.lastAppliedSeasonState;
  }

  async writeLastAppliedSeasonState(state: NeuroPassSeasonState): Promise<void> {
    this.lastAppliedSeasonState = state;
  }

  async readTimeHeuristicState(): Promise<NeuroPassTimeHeuristicState> {
    return { ...this.timeHeuristicState };
  }

  async writeTimeHeuristicState(state: NeuroPassTimeHeuristicState): Promise<void> {
    this.timeHeuristicState = { ...state };
  }

  async getEntitlement(seasonId: string): Promise<NeuroPassEntitlement> {
    const fallback = buildDefaultNeuroPassEntitlement(seasonId);
    return {
      ...fallback,
      seasonId: this.entitlement.seasonId ?? seasonId,
      premiumOwned: this.entitlement.premiumOwned,
      passSkuPurchased:
        this.entitlement.passSkuPurchased === 'plus' || this.entitlement.passSkuPurchased === 'standard'
          ? this.entitlement.passSkuPurchased
          : null,
      plusTierSkipsRemaining: this.entitlement.plusTierSkipsRemaining,
      purchasedTierSkipsBalance: this.entitlement.purchasedTierSkipsBalance ?? 0,
      tierSkipsPurchasedTodayCount: this.entitlement.tierSkipsPurchasedTodayCount ?? 0,
      bonusUnlockedTiers: this.entitlement.bonusUnlockedTiers ?? 0,
      lastPurchaseAtUtc: this.entitlement.lastPurchaseAtUtc,
      lastRestoreAtUtc: this.entitlement.lastRestoreAtUtc,
      purchasedSkus: this.entitlement.purchasedSkus ?? [],
    };
  }

  async setEntitlement(_seasonId: string, entitlement: NeuroPassEntitlement): Promise<void> {
    this.entitlement = {
      seasonId: entitlement.seasonId,
      premiumOwned: entitlement.premiumOwned,
      passSkuPurchased: entitlement.passSkuPurchased,
      plusTierSkipsRemaining: entitlement.plusTierSkipsRemaining,
      purchasedTierSkipsBalance: entitlement.purchasedTierSkipsBalance,
      tierSkipsPurchasedTodayCount: entitlement.tierSkipsPurchasedTodayCount,
      bonusUnlockedTiers: entitlement.bonusUnlockedTiers,
      lastPurchaseAtUtc: entitlement.lastPurchaseAtUtc,
      lastRestoreAtUtc: entitlement.lastRestoreAtUtc,
      purchasedSkus: entitlement.purchasedSkus,
    };
  }
}

export class InMemoryXpLedgerRepository implements NeuroPassXpLedgerRepository {
  private grants: NeuroPassXpGrant[] = [];
  private readonly seenRunIds = new Set<string>();

  async hasGrant(id: string, source: NeuroPassXpSource): Promise<boolean> {
    return this.grants.some((grant) => grant.id === id && grant.source === source);
  }

  async hasSeenRunId(runId: string): Promise<boolean> {
    return this.seenRunIds.has(runId);
  }

  async rebuildSeenRunIdsIndex(): Promise<number> {
    this.seenRunIds.clear();
    this.grants.forEach((grant) => {
      if (grant.source === 'run' && grant.id) {
        this.seenRunIds.add(grant.id);
      }
    });
    return this.seenRunIds.size;
  }

  async getTodayRunTotal(nowUtc: Date): Promise<number> {
    const range = getTodayUtcRange(nowUtc);
    return this.grants.reduce((sum, grant) => {
      if (grant.source !== 'run') {
        return sum;
      }

      if (!isInUtcRange(grant.createdAtUtc, range)) {
        return sum;
      }

      return sum + grant.amount;
    }, 0);
  }

  async append(grant: NeuroPassXpGrant): Promise<void> {
    this.grants.push(grant);
    if (grant.source === 'run' && grant.id) {
      this.seenRunIds.add(grant.id);
    }
  }

  async getTodayTotalNxp(nowUtc: Date): Promise<number> {
    const range = getTodayUtcRange(nowUtc);
    return this.grants.reduce((sum, grant) => {
      if (!isInUtcRange(grant.createdAtUtc, range)) {
        return sum;
      }
      return sum + grant.amount;
    }, 0);
  }

  async listTodayGrants(nowUtc: Date): Promise<NeuroPassXpGrant[]> {
    const range = getTodayUtcRange(nowUtc);
    return this.grants.filter((grant) => isInUtcRange(grant.createdAtUtc, range));
  }

  async listAll(): Promise<NeuroPassXpGrant[]> {
    return [...this.grants];
  }

  seed(grants: NeuroPassXpGrant[]): void {
    this.grants = [...grants];
    this.seenRunIds.clear();
    grants.forEach((grant) => {
      if (grant.source === 'run' && grant.id) {
        this.seenRunIds.add(grant.id);
      }
    });
  }
}

export class InMemoryNeuroPassQuestsRepository implements NeuroPassQuestsRepository {
  state: NeuroPassQuestsStateBundle | null = null;

  async readQuestState(): Promise<NeuroPassQuestsStateBundle | null> {
    return this.state ? cloneQuestState(this.state) : null;
  }

  async writeQuestState(state: NeuroPassQuestsStateBundle): Promise<void> {
    this.state = cloneQuestState(state);
  }
}

export class CapturingAnalyticsClient implements AnalyticsClient {
  readonly events: Array<{ name: string; params?: AnalyticsParams }> = [];

  track(eventName: string, params?: AnalyticsParams): void {
    this.events.push({
      name: eventName,
      params,
    });
  }
}

export function createAnalyticsService(client: CapturingAnalyticsClient = new CapturingAnalyticsClient()) {
  return {
    service: new AnalyticsService(client),
    client,
  };
}

function cloneQuestState(state: NeuroPassQuestsStateBundle): NeuroPassQuestsStateBundle {
  return JSON.parse(JSON.stringify(state)) as NeuroPassQuestsStateBundle;
}
