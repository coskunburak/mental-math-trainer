import type { NeuroPassPersistedEntitlementModel, NeuroPassPersistedProgressModel } from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export interface ApplySeasonTransitionInput {
  seasonId: string;
  seasonState: NeuroPassSeasonState;
  progress: NeuroPassPersistedProgressModel;
  entitlement: NeuroPassPersistedEntitlementModel;
  lastSeenSeasonId: string | null;
  lastAppliedSeasonState: NeuroPassSeasonState | null;
  nowUtcIso: string;
}

export interface ApplySeasonTransitionResult {
  progress: NeuroPassPersistedProgressModel;
  entitlement: NeuroPassPersistedEntitlementModel;
  nextLastSeenSeasonId: string;
  nextLastAppliedSeasonState: NeuroPassSeasonState;
  seasonChanged: boolean;
  stateChanged: boolean;
  shouldResetClaimPlaceholder: boolean;
}

export class ApplySeasonTransition {
  execute(input: ApplySeasonTransitionInput): ApplySeasonTransitionResult {
    const seasonChanged = input.lastSeenSeasonId !== input.seasonId;
    const stateChanged = input.lastAppliedSeasonState !== input.seasonState;

    if (seasonChanged) {
      return {
        progress: {
          currentNxp: 0,
          lastUpdatedAtUtc: input.nowUtcIso,
        },
        entitlement: {
          seasonId: input.seasonId,
          premiumOwned: false,
          passSkuPurchased: null,
          plusTierSkipsRemaining: 0,
          purchasedTierSkipsBalance: 0,
          tierSkipsPurchasedTodayCount: 0,
          bonusUnlockedTiers: 0,
          purchasedSkus: [],
        },
        nextLastSeenSeasonId: input.seasonId,
        nextLastAppliedSeasonState: input.seasonState,
        seasonChanged,
        stateChanged,
        shouldResetClaimPlaceholder: true,
      };
    }

    return {
      progress: {
        currentNxp: Math.max(0, Math.floor(input.progress.currentNxp)),
        lastUpdatedAtUtc: input.progress.lastUpdatedAtUtc,
      },
      entitlement: {
        seasonId: typeof input.entitlement.seasonId === 'string'
          ? input.entitlement.seasonId
          : input.seasonId,
        premiumOwned: Boolean(input.entitlement.premiumOwned),
        passSkuPurchased:
          input.entitlement.passSkuPurchased === 'plus' || input.entitlement.passSkuPurchased === 'standard'
            ? input.entitlement.passSkuPurchased
            : null,
        plusTierSkipsRemaining: Math.max(0, Math.floor(input.entitlement.plusTierSkipsRemaining)),
        purchasedTierSkipsBalance: Math.max(
          0,
          Math.floor(input.entitlement.purchasedTierSkipsBalance ?? 0),
        ),
        tierSkipsPurchasedTodayCount: Math.max(
          0,
          Math.floor(input.entitlement.tierSkipsPurchasedTodayCount ?? 0),
        ),
        bonusUnlockedTiers: Math.max(0, Math.floor(input.entitlement.bonusUnlockedTiers ?? 0)),
        lastPurchaseAtUtc: input.entitlement.lastPurchaseAtUtc,
        lastRestoreAtUtc: input.entitlement.lastRestoreAtUtc,
        purchasedSkus: Array.isArray(input.entitlement.purchasedSkus)
          ? input.entitlement.purchasedSkus
          : [],
      },
      nextLastSeenSeasonId: input.seasonId,
      nextLastAppliedSeasonState: input.seasonState,
      seasonChanged,
      stateChanged,
      shouldResetClaimPlaceholder: false,
    };
  }
}
