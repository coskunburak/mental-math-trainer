import {
  NEURO_PASS_MIN_SUPPORTED_MANIFEST_VERSION,
  NEURO_PASS_TIERS_TOTAL,
  NEURO_PASS_XP_PER_TIER,
  parseManifestJson,
  type NeuroPassManifestModel,
  type NeuroPassRewardSlotModel,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';
import type {
  ManifestCandidate,
  ManifestLoadStrategy,
  NeuroPassManifestSource,
  NeuroPassRepository,
} from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import { buildManifestValidationSummary, SeasonManifestValidator } from '@features/neuroPass/domain/services/SeasonManifestValidator';
import {
  buildNeuroPassProgress,
  DEFAULT_NEURO_PASS_PROGRESS,
} from '@features/neuroPass/domain/entities/NeuroPassProgress';
import {
  DEFAULT_NEURO_PASS_ENTITLEMENT,
  totalTierSkipsBalance,
} from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import {
  classifyNeuroPassSeasonState,
  computeNeuroPassDayLeft,
  computeNeuroPassTimeLeftMs,
} from '@features/neuroPass/domain/types/NeuroPassSeasonState';

import { ApplySeasonTransition } from './ApplySeasonTransition';

export interface LoadNeuroPassDashboardInput {
  strategy?: ManifestLoadStrategy;
}

export class LoadNeuroPassDashboard {
  constructor(
    private readonly repository: NeuroPassRepository,
    private readonly validator: SeasonManifestValidator,
    private readonly applySeasonTransition: ApplySeasonTransition,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(input: LoadNeuroPassDashboardInput = {}): Promise<NeuroPassDashboard> {
    const strategy = input.strategy ?? 'cached_first';
    const nowUtc = new Date(this.now());

    const [
      progress,
      lastSeenSeasonId,
      lastAppliedSeasonState,
      manifestCandidates,
    ] = await Promise.all([
      this.repository.readProgress(),
      this.repository.readLastSeenSeasonId(),
      this.repository.readLastAppliedSeasonState(),
      this.repository.getManifestCandidates(strategy),
    ]);

    const manifestResolution = this.resolveManifest(manifestCandidates);

    if (!manifestResolution.manifest || !manifestResolution.rawJson || !manifestResolution.source) {
      const unavailable = this.buildUnavailableDashboard(progress.currentNxp, progress.lastUpdatedAtUtc, {
        reason: manifestResolution.errors.join(' | ').slice(0, 400),
      });

      if (isDevRuntime() && manifestResolution.errors.length > 0) {
        // eslint-disable-next-line no-console
        console.error('[NeuroPass] Manifest resolution failed', manifestResolution.errors);
      }

      return unavailable;
    }

    const manifest = manifestResolution.manifest;
    const entitlement = await this.repository.readEntitlementForSeason(manifest.seasonId);

    if (manifestResolution.source === 'remote_config' || manifestResolution.source === 'asset') {
      await this.repository.saveCachedManifest(manifestResolution.rawJson);
    }

    const startAtUtc = new Date(manifest.startAt);
    const endAtUtc = new Date(manifest.endAt);
    const graceEndAtUtc = new Date(manifest.graceEndAt);

    const state = classifyNeuroPassSeasonState({
      nowUtc,
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });

    const transition = this.applySeasonTransition.execute({
      seasonId: manifest.seasonId,
      seasonState: state,
      progress,
      entitlement,
      lastSeenSeasonId,
      lastAppliedSeasonState,
      nowUtcIso: nowUtc.toISOString(),
    });

    await Promise.all([
      this.repository.writeProgress(transition.progress),
      this.repository.writeEntitlement(transition.entitlement),
      this.repository.writeEntitlementForSeason(manifest.seasonId, transition.entitlement),
      this.repository.writeLastSeenSeasonId(transition.nextLastSeenSeasonId),
      this.repository.writeLastAppliedSeasonState(transition.nextLastAppliedSeasonState),
      transition.shouldResetClaimPlaceholder
        ? this.repository.writeClaimPlaceholder({ claimedRewardKeys: [] })
        : Promise.resolve(),
    ]);

    const normalizedProgress = buildNeuroPassProgress({
      currentNxp: transition.progress.currentNxp,
      lastUpdatedAtUtc: transition.progress.lastUpdatedAtUtc,
      xpPerTier: manifest.xpPerTier,
      tiersTotal: manifest.tiersTotal,
    });

    const season = {
      id: manifest.seasonId,
      name: manifest.name,
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
      tiersTotal: manifest.tiersTotal,
      xpPerTier: manifest.xpPerTier,
      state,
    };
    const effectiveTier = Math.min(
      manifest.tiersTotal,
      normalizedProgress.currentTier + Math.max(0, Math.floor(transition.entitlement.bonusUnlockedTiers ?? 0)),
    );
    const bonusUnlockedTiers = Math.max(0, effectiveTier - normalizedProgress.currentTier);
    const tierSkipsBalance = totalTierSkipsBalance({
      seasonId: manifest.seasonId,
      premiumOwned: Boolean(transition.entitlement.premiumOwned),
      passSkuPurchased:
        transition.entitlement.passSkuPurchased === 'plus' || transition.entitlement.passSkuPurchased === 'standard'
          ? transition.entitlement.passSkuPurchased
          : null,
      plusTierSkipsRemaining: Math.max(0, Math.floor(transition.entitlement.plusTierSkipsRemaining)),
      purchasedTierSkipsBalance: Math.max(
        0,
        Math.floor(transition.entitlement.purchasedTierSkipsBalance ?? 0),
      ),
      tierSkipsPurchasedTodayCount: Math.max(
        0,
        Math.floor(transition.entitlement.tierSkipsPurchasedTodayCount ?? 0),
      ),
      bonusUnlockedTiers,
      lastPurchaseAtUtc: transition.entitlement.lastPurchaseAtUtc,
      lastRestoreAtUtc: transition.entitlement.lastRestoreAtUtc,
      purchasedSkus: Array.isArray(transition.entitlement.purchasedSkus)
        ? transition.entitlement.purchasedSkus
        : [],
    });

    const milestoneSet = new Set<number>(manifest.milestones.featuredTiers.map((entry) => entry.tier));

    const tiers = new Array(manifest.tiersTotal).fill(null).map((_, index) => ({
      tierIndex: index + 1,
      freeReward: mapRewardSlot(manifest.freeTrack[index]),
      premiumReward: mapRewardSlot(manifest.premiumTrack[index]),
      isMilestone: milestoneSet.has(index + 1),
      isUnlockedByProgress: index + 1 <= effectiveTier,
    }));

    const dayLeft = computeNeuroPassDayLeft({
      nowUtc,
      state,
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });

    const timeLeftMs = computeNeuroPassTimeLeftMs({
      nowUtc,
      state,
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });

    return {
      status: 'ready',
      season,
      tiers,
      progress: normalizedProgress,
      effectiveTier,
      bonusUnlockedTiers,
      tierSkipsBalance,
      entitlement: {
        seasonId: manifest.seasonId,
        premiumOwned: Boolean(transition.entitlement.premiumOwned),
        passSkuPurchased:
          transition.entitlement.passSkuPurchased === 'plus' || transition.entitlement.passSkuPurchased === 'standard'
            ? transition.entitlement.passSkuPurchased
            : null,
        plusTierSkipsRemaining: Math.max(0, Math.floor(transition.entitlement.plusTierSkipsRemaining)),
        purchasedTierSkipsBalance: Math.max(
          0,
          Math.floor(transition.entitlement.purchasedTierSkipsBalance ?? 0),
        ),
        tierSkipsPurchasedTodayCount: Math.max(
          0,
          Math.floor(transition.entitlement.tierSkipsPurchasedTodayCount ?? 0),
        ),
        bonusUnlockedTiers,
        lastPurchaseAtUtc: transition.entitlement.lastPurchaseAtUtc,
        lastRestoreAtUtc: transition.entitlement.lastRestoreAtUtc,
        purchasedSkus: Array.isArray(transition.entitlement.purchasedSkus)
          ? transition.entitlement.purchasedSkus
          : [],
      },
      timeLeftMs,
      dayLeft,
      state,
    };
  }

  private buildUnavailableDashboard(
    currentNxp: number,
    lastUpdatedAtUtc: string,
    input?: { reason?: string },
  ): NeuroPassDashboard {
    return {
      status: 'unavailable',
      season: null,
      tiers: [],
      progress: buildNeuroPassProgress({
        currentNxp,
        lastUpdatedAtUtc,
        xpPerTier: NEURO_PASS_XP_PER_TIER,
        tiersTotal: NEURO_PASS_TIERS_TOTAL,
      }),
      effectiveTier: DEFAULT_NEURO_PASS_PROGRESS.currentTier,
      bonusUnlockedTiers: 0,
      tierSkipsBalance: 0,
      entitlement: DEFAULT_NEURO_PASS_ENTITLEMENT,
      timeLeftMs: 0,
      dayLeft: 0,
      state: 'ended',
      unavailableReason: input?.reason ?? 'manifest_unavailable',
    };
  }

  private resolveManifest(candidates: ManifestCandidate[]): {
    manifest: NeuroPassManifestModel | null;
    rawJson: string | null;
    source: NeuroPassManifestSource | null;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const candidate of candidates) {
      let parsed: unknown;

      try {
        parsed = parseManifestJson(candidate.rawJson);
      } catch {
        errors.push(`${candidate.source}: invalid JSON`);
        continue;
      }

      const validation = this.validator.validate(parsed, {
        minSupportedVersion: NEURO_PASS_MIN_SUPPORTED_MANIFEST_VERSION,
      });

      if (!validation.ok) {
        const summary = buildManifestValidationSummary(validation);
        errors.push(`${candidate.source}: ${summary}`);
        continue;
      }

      return {
        manifest: validation.manifest,
        rawJson: candidate.rawJson,
        source: candidate.source,
        errors,
      };
    }

    return {
      manifest: null,
      rawJson: null,
      source: null,
      errors,
    };
  }
}

function isDevRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }

  return process.env.NODE_ENV !== 'production';
}

function mapRewardSlot(slot: NeuroPassRewardSlotModel) {
  return {
    id: slot.rewardId,
    type: slot.rewardType,
    contentId: slot.contentId,
    amount: Math.max(0, Math.floor(slot.amount)),
    title: slot.title,
  };
}

export function formatNeuroPassTimeLeft(ms: number): string {
  const safe = Math.max(0, ms);
  const totalHours = Math.floor(safe / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days <= 0) {
    return `${hours}h`;
  }

  return `${days}d ${hours}h`;
}

export const NEURO_PASS_DEFAULT_DASHBOARD: NeuroPassDashboard = {
  status: 'unavailable',
  season: null,
  tiers: [],
  progress: DEFAULT_NEURO_PASS_PROGRESS,
  effectiveTier: DEFAULT_NEURO_PASS_PROGRESS.currentTier,
  bonusUnlockedTiers: 0,
  tierSkipsBalance: 0,
  entitlement: DEFAULT_NEURO_PASS_ENTITLEMENT,
  timeLeftMs: 0,
  dayLeft: 0,
  state: 'ended',
  unavailableReason: 'not_loaded',
};
