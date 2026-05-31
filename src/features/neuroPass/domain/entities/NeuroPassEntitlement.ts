export type NeuroPassPassSkuPurchased = 'standard' | 'plus' | null;

export interface NeuroPassEntitlement {
  seasonId: string;
  premiumOwned: boolean;
  passSkuPurchased: NeuroPassPassSkuPurchased;
  plusTierSkipsRemaining: number;
  purchasedTierSkipsBalance: number;
  tierSkipsPurchasedTodayCount: number;
  bonusUnlockedTiers: number;
  lastPurchaseAtUtc?: string;
  lastRestoreAtUtc?: string;
  purchasedSkus: string[];
}

export function buildDefaultNeuroPassEntitlement(seasonId: string): NeuroPassEntitlement {
  return {
    seasonId,
    premiumOwned: false,
    passSkuPurchased: null,
    plusTierSkipsRemaining: 0,
    purchasedTierSkipsBalance: 0,
    tierSkipsPurchasedTodayCount: 0,
    bonusUnlockedTiers: 0,
    purchasedSkus: [],
  };
}

export const DEFAULT_NEURO_PASS_ENTITLEMENT: NeuroPassEntitlement =
  buildDefaultNeuroPassEntitlement('unknown_season');

export function totalTierSkipsBalance(entitlement: NeuroPassEntitlement): number {
  return Math.max(
    0,
    Math.floor(entitlement.plusTierSkipsRemaining) + Math.floor(entitlement.purchasedTierSkipsBalance),
  );
}
