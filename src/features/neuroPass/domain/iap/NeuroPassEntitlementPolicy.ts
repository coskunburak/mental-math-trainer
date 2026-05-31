import {
  buildDefaultNeuroPassEntitlement,
  type NeuroPassEntitlement,
} from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';

export type NeuroPassPlan = 'standard' | 'plus';

export class NeuroPassEntitlementPolicy {
  constructor(private readonly skuBuilder: NeuroPassSkuBuilder) {}

  applyPurchase(
    entitlement: NeuroPassEntitlement,
    input: {
      seasonId: string;
      sku: string;
      purchasedAtUtc: string;
    },
  ): NeuroPassEntitlement {
    const base = normalizeEntitlement(entitlement, input.seasonId);
    const standardSku = this.skuBuilder.buildStandardSku(input.seasonId);
    const plusSku = this.skuBuilder.buildPlusSku(input.seasonId);

    const nextPurchasedSkus = [...new Set([...base.purchasedSkus, input.sku])];

    if (input.sku === plusSku) {
      return this.ensurePlusSkips({
        ...base,
        premiumOwned: true,
        passSkuPurchased: 'plus',
        purchasedSkus: nextPurchasedSkus,
        lastPurchaseAtUtc: input.purchasedAtUtc,
      });
    }

    if (input.sku === standardSku) {
      return {
        ...base,
        premiumOwned: true,
        passSkuPurchased: base.passSkuPurchased === 'plus' ? 'plus' : 'standard',
        purchasedSkus: nextPurchasedSkus,
        lastPurchaseAtUtc: input.purchasedAtUtc,
      };
    }

    return {
      ...base,
      purchasedSkus: nextPurchasedSkus,
      lastPurchaseAtUtc: input.purchasedAtUtc,
    };
  }

  ensurePlusSkips(entitlement: NeuroPassEntitlement): NeuroPassEntitlement {
    return {
      ...entitlement,
      plusTierSkipsRemaining: Math.max(10, Math.floor(entitlement.plusTierSkipsRemaining)),
    };
  }
}

function normalizeEntitlement(entitlement: NeuroPassEntitlement, seasonId: string): NeuroPassEntitlement {
  if (entitlement.seasonId !== seasonId) {
    return buildDefaultNeuroPassEntitlement(seasonId);
  }

  return {
    ...entitlement,
    seasonId,
    premiumOwned: Boolean(entitlement.premiumOwned),
    passSkuPurchased:
      entitlement.passSkuPurchased === 'plus' || entitlement.passSkuPurchased === 'standard'
        ? entitlement.passSkuPurchased
        : null,
    plusTierSkipsRemaining: Math.max(0, Math.floor(entitlement.plusTierSkipsRemaining ?? 0)),
    purchasedTierSkipsBalance: Math.max(0, Math.floor(entitlement.purchasedTierSkipsBalance ?? 0)),
    tierSkipsPurchasedTodayCount: Math.max(0, Math.floor(entitlement.tierSkipsPurchasedTodayCount ?? 0)),
    bonusUnlockedTiers: Math.max(0, Math.floor(entitlement.bonusUnlockedTiers ?? 0)),
    purchasedSkus: Array.isArray(entitlement.purchasedSkus)
      ? entitlement.purchasedSkus.filter((item) => typeof item === 'string' && item.trim().length > 0)
      : [],
  };
}
