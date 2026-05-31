import type {
  NeuroPassClaimPlaceholderModel,
  NeuroPassPersistedEntitlementModel,
  NeuroPassPersistedProgressModel,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import { NeuroPassManifestAssetDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestAssetDataSource';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import { NeuroPassManifestRemoteConfigDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestRemoteConfigDataSource';
import type { NeuroPassTimeHeuristicState } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type {
  ManifestCandidate,
  ManifestLoadStrategy,
  NeuroPassRepository,
} from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export class NeuroPassRepositoryImpl implements NeuroPassRepository {
  constructor(
    private readonly remoteDataSource: NeuroPassManifestRemoteConfigDataSource,
    private readonly assetDataSource: NeuroPassManifestAssetDataSource,
    private readonly localStore: NeuroPassLocalStore,
  ) {}

  async getManifestCandidates(strategy: ManifestLoadStrategy): Promise<ManifestCandidate[]> {
    if (strategy === 'remote_first') {
      const [remote, asset, cache] = await Promise.all([
        this.remoteDataSource.loadManifestJson(),
        this.assetDataSource.loadManifestJson(),
        this.localStore.readCachedManifest(),
      ]);

      return compactCandidates([
        { source: 'remote_config', rawJson: remote },
        { source: 'asset', rawJson: asset },
        { source: 'cache', rawJson: cache },
      ]);
    }

    const [cache, asset] = await Promise.all([
      this.localStore.readCachedManifest(),
      this.assetDataSource.loadManifestJson(),
    ]);

    return compactCandidates([
      { source: 'cache', rawJson: cache },
      { source: 'asset', rawJson: asset },
    ]);
  }

  async saveCachedManifest(rawJson: string): Promise<void> {
    await this.localStore.writeCachedManifest(rawJson);
  }

  async readProgress(): Promise<NeuroPassPersistedProgressModel> {
    return this.localStore.readProgress();
  }

  async writeProgress(progress: NeuroPassPersistedProgressModel): Promise<void> {
    await this.localStore.writeProgress(progress);
  }

  async readEntitlement(): Promise<NeuroPassPersistedEntitlementModel> {
    return this.localStore.readEntitlement();
  }

  async writeEntitlement(entitlement: NeuroPassPersistedEntitlementModel): Promise<void> {
    await this.localStore.writeEntitlement(entitlement);
  }

  async readEntitlementForSeason(seasonId: string): Promise<NeuroPassPersistedEntitlementModel> {
    const entitlement = await this.localStore.getEntitlement(seasonId);
    return {
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

  async writeEntitlementForSeason(
    seasonId: string,
    entitlement: NeuroPassPersistedEntitlementModel,
  ): Promise<void> {
    await this.localStore.setEntitlement(seasonId, {
      seasonId,
      premiumOwned: Boolean(entitlement.premiumOwned),
      passSkuPurchased:
        entitlement.passSkuPurchased === 'plus' || entitlement.passSkuPurchased === 'standard'
          ? entitlement.passSkuPurchased
          : null,
      plusTierSkipsRemaining: Math.max(0, Math.floor(entitlement.plusTierSkipsRemaining)),
      purchasedTierSkipsBalance: Math.max(0, Math.floor(entitlement.purchasedTierSkipsBalance ?? 0)),
      tierSkipsPurchasedTodayCount: Math.max(
        0,
        Math.floor(entitlement.tierSkipsPurchasedTodayCount ?? 0),
      ),
      bonusUnlockedTiers: Math.max(0, Math.floor(entitlement.bonusUnlockedTiers ?? 0)),
      lastPurchaseAtUtc: entitlement.lastPurchaseAtUtc,
      lastRestoreAtUtc: entitlement.lastRestoreAtUtc,
      purchasedSkus: Array.isArray(entitlement.purchasedSkus) ? entitlement.purchasedSkus : [],
    });
  }

  async readClaimPlaceholder(): Promise<NeuroPassClaimPlaceholderModel> {
    return this.localStore.readClaimPlaceholder();
  }

  async writeClaimPlaceholder(claimState: NeuroPassClaimPlaceholderModel): Promise<void> {
    await this.localStore.writeClaimPlaceholder(claimState);
  }

  async getClaimedRewardKeys(): Promise<string[]> {
    return this.localStore.getClaimedRewardKeys();
  }

  async setClaimedRewardKeys(keys: string[]): Promise<void> {
    await this.localStore.setClaimedRewardKeys(keys);
  }

  async hasClaimKey(key: string): Promise<boolean> {
    const normalized = key.trim();
    if (normalized.length === 0) {
      return false;
    }

    const keys = await this.localStore.getClaimedRewardKeys();
    return keys.includes(normalized);
  }

  async addClaimKey(key: string): Promise<void> {
    const normalized = key.trim();
    if (!normalized) {
      return;
    }

    const keys = await this.localStore.getClaimedRewardKeys();
    if (keys.includes(normalized)) {
      return;
    }

    await this.localStore.setClaimedRewardKeys([...keys, normalized].slice(-1000));
  }

  async readLastSeenSeasonId(): Promise<string | null> {
    return this.localStore.readLastSeenSeasonId();
  }

  async writeLastSeenSeasonId(seasonId: string): Promise<void> {
    await this.localStore.writeLastSeenSeasonId(seasonId);
  }

  async readLastAppliedSeasonState(): Promise<NeuroPassSeasonState | null> {
    return this.localStore.readLastAppliedSeasonState();
  }

  async writeLastAppliedSeasonState(state: NeuroPassSeasonState): Promise<void> {
    await this.localStore.writeLastAppliedSeasonState(state);
  }

  async readTimeHeuristicState(): Promise<NeuroPassTimeHeuristicState> {
    return this.localStore.readTimeHeuristicState();
  }

  async writeTimeHeuristicState(state: NeuroPassTimeHeuristicState): Promise<void> {
    await this.localStore.writeTimeHeuristicState(state);
  }

  async getEntitlement(seasonId: string): Promise<NeuroPassEntitlement> {
    return this.localStore.getEntitlement(seasonId);
  }

  async setEntitlement(seasonId: string, entitlement: NeuroPassEntitlement): Promise<void> {
    await this.localStore.setEntitlement(seasonId, entitlement);
  }
}

function compactCandidates(
  input: Array<{ source: ManifestCandidate['source']; rawJson: string | null }>,
): ManifestCandidate[] {
  return input
    .filter((item): item is { source: ManifestCandidate['source']; rawJson: string } =>
      typeof item.rawJson === 'string' && item.rawJson.trim().length > 0,
    )
    .map((item) => ({
      source: item.source,
      rawJson: item.rawJson,
    }));
}
