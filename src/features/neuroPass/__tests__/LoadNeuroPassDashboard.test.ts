import type {
  ManifestCandidate,
  ManifestLoadStrategy,
  NeuroPassRepository,
} from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import type { NeuroPassPersistedEntitlementModel } from '@features/neuroPass/data/models/NeuroPassManifestModel';
import { SeasonManifestValidator } from '@features/neuroPass/domain/services/SeasonManifestValidator';
import { ApplySeasonTransition } from '@features/neuroPass/domain/usecases/ApplySeasonTransition';
import { LoadNeuroPassDashboard } from '@features/neuroPass/domain/usecases/LoadNeuroPassDashboard';

const manifest = require('../assets/manifest_default.json');

class FakeRepository implements NeuroPassRepository {
  manifestCandidates: ManifestCandidate[] = [];
  progress = {
    currentNxp: 1250,
    lastUpdatedAtUtc: '2026-02-10T00:00:00.000Z',
  };
  entitlement = {
    seasonId: manifest.seasonId,
    premiumOwned: false,
    passSkuPurchased: null as 'standard' | 'plus' | null,
    plusTierSkipsRemaining: 0,
    purchasedTierSkipsBalance: 0,
    tierSkipsPurchasedTodayCount: 0,
    bonusUnlockedTiers: 0,
    purchasedSkus: [] as string[],
  };
  claimState = {
    claimedRewardKeys: [] as string[],
  };
  lastSeenSeasonId: string | null = manifest.seasonId;
  lastAppliedSeasonState: 'preseason' | 'active' | 'grace' | 'ended' | null = 'active';
  cachedManifest: string | null = null;
  timeHeuristicState = {
    suspiciousTime: false,
    stableSamples: 0,
  };

  async getManifestCandidates(_strategy: ManifestLoadStrategy): Promise<ManifestCandidate[]> {
    return this.manifestCandidates;
  }

  async saveCachedManifest(rawJson: string): Promise<void> {
    this.cachedManifest = rawJson;
  }

  async readProgress() {
    return this.progress;
  }

  async writeProgress(progress: { currentNxp: number; lastUpdatedAtUtc: string }): Promise<void> {
    this.progress = progress;
  }

  async readEntitlement() {
    return this.entitlement;
  }

  async writeEntitlement(entitlement: NeuroPassPersistedEntitlementModel): Promise<void> {
    this.entitlement = {
      ...this.entitlement,
      ...entitlement,
    };
  }

  async readEntitlementForSeason(_seasonId: string) {
    return this.entitlement;
  }

  async writeEntitlementForSeason(
    _seasonId: string,
    entitlement: NeuroPassPersistedEntitlementModel,
  ): Promise<void> {
    this.entitlement = {
      ...this.entitlement,
      ...entitlement,
    };
  }

  async readClaimPlaceholder() {
    return this.claimState;
  }

  async writeClaimPlaceholder(claimState: { claimedRewardKeys: string[] }): Promise<void> {
    this.claimState = claimState;
  }

  async getClaimedRewardKeys(): Promise<string[]> {
    return [...this.claimState.claimedRewardKeys];
  }

  async setClaimedRewardKeys(keys: string[]): Promise<void> {
    this.claimState = {
      claimedRewardKeys: [...keys],
    };
  }

  async hasClaimKey(key: string): Promise<boolean> {
    return this.claimState.claimedRewardKeys.includes(key);
  }

  async addClaimKey(key: string): Promise<void> {
    if (this.claimState.claimedRewardKeys.includes(key)) {
      return;
    }

    this.claimState = {
      claimedRewardKeys: [...this.claimState.claimedRewardKeys, key],
    };
  }

  async readLastSeenSeasonId(): Promise<string | null> {
    return this.lastSeenSeasonId;
  }

  async writeLastSeenSeasonId(seasonId: string): Promise<void> {
    this.lastSeenSeasonId = seasonId;
  }

  async readLastAppliedSeasonState(): Promise<'preseason' | 'active' | 'grace' | 'ended' | null> {
    return this.lastAppliedSeasonState;
  }

  async writeLastAppliedSeasonState(state: 'preseason' | 'active' | 'grace' | 'ended'): Promise<void> {
    this.lastAppliedSeasonState = state;
  }

  async readTimeHeuristicState() {
    return { ...this.timeHeuristicState };
  }

  async writeTimeHeuristicState(state: { suspiciousTime: boolean; stableSamples: number }): Promise<void> {
    this.timeHeuristicState = { ...state };
  }

  async getEntitlement(_seasonId: string) {
    return this.entitlement;
  }

  async setEntitlement(_seasonId: string, entitlement: typeof this.entitlement): Promise<void> {
    this.entitlement = entitlement;
  }
}

describe('LoadNeuroPassDashboard', () => {
  it('builds dashboard with tier and progress from local data', async () => {
    const repository = new FakeRepository();
    repository.manifestCandidates = [
      {
        source: 'asset',
        rawJson: JSON.stringify(manifest),
      },
    ];

    const usecase = new LoadNeuroPassDashboard(
      repository,
      new SeasonManifestValidator(),
      new ApplySeasonTransition(),
      () => Date.parse('2026-02-10T12:00:00.000Z'),
    );

    const dashboard = await usecase.execute({ strategy: 'cached_first' });

    expect(dashboard.status).toBe('ready');
    expect(dashboard.season?.id).toBe('neuro_pass_s1');
    expect(dashboard.tiers).toHaveLength(40);
    expect(dashboard.progress.currentTier).toBe(3);
    expect(dashboard.progress.tierProgressPct).toBe(0.5);
    expect(dashboard.effectiveTier).toBe(3);
    expect(dashboard.tierSkipsBalance).toBe(0);
    expect(dashboard.state).toBe('active');
    expect(dashboard.dayLeft).toBe(19);
  });

  it('returns unavailable when no manifest candidate validates', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const repository = new FakeRepository();
    repository.manifestCandidates = [
      {
        source: 'asset',
        rawJson: '{"bad":true}',
      },
    ];

    const usecase = new LoadNeuroPassDashboard(
      repository,
      new SeasonManifestValidator(),
      new ApplySeasonTransition(),
      () => Date.parse('2026-02-10T12:00:00.000Z'),
    );

    const dashboard = await usecase.execute({ strategy: 'cached_first' });

    expect(dashboard.status).toBe('unavailable');
    expect(dashboard.season).toBeNull();
    expect(dashboard.tiers).toHaveLength(0);
    errorSpy.mockRestore();
  });
});
