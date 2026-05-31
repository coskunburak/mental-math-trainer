import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';

export interface ConsumeTierSkipResult {
  ok: boolean;
  consumed: number;
  entitlement: NeuroPassEntitlement;
}

const TIER_SKIP_5_DAILY_MAX = 2;

export class NeuroPassTierSkipPolicy {
  canPurchaseTierSkip5(todayCount: number): boolean {
    return Math.max(0, Math.floor(todayCount)) < TIER_SKIP_5_DAILY_MAX;
  }

  applyTierSkipPurchase(entitlement: NeuroPassEntitlement): NeuroPassEntitlement {
    return {
      ...entitlement,
      purchasedTierSkipsBalance: Math.max(0, Math.floor(entitlement.purchasedTierSkipsBalance)) + 5,
    };
  }

  consumeOneSkip(entitlement: NeuroPassEntitlement): ConsumeTierSkipResult {
    return this.consumeSkips(entitlement, 1);
  }

  consumeSkips(entitlement: NeuroPassEntitlement, count: number): ConsumeTierSkipResult {
    const requested = Math.max(1, Math.floor(count));

    let remainingPurchased = Math.max(0, Math.floor(entitlement.purchasedTierSkipsBalance));
    let remainingPlus = Math.max(0, Math.floor(entitlement.plusTierSkipsRemaining));

    const total = remainingPurchased + remainingPlus;
    if (total < requested) {
      return {
        ok: false,
        consumed: 0,
        entitlement,
      };
    }

    // We consume purchased skips first to avoid stranded consumable balance.
    const consumeFromPurchased = Math.min(remainingPurchased, requested);
    remainingPurchased -= consumeFromPurchased;

    const remainingToConsume = requested - consumeFromPurchased;
    if (remainingToConsume > 0) {
      remainingPlus -= remainingToConsume;
    }

    return {
      ok: true,
      consumed: requested,
      entitlement: {
        ...entitlement,
        purchasedTierSkipsBalance: remainingPurchased,
        plusTierSkipsRemaining: remainingPlus,
        bonusUnlockedTiers: Math.max(0, Math.floor(entitlement.bonusUnlockedTiers)) + requested,
      },
    };
  }
}
