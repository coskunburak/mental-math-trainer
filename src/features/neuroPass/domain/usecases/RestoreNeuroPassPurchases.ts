import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import { NeuroPassEntitlementPolicy } from '@features/neuroPass/domain/iap/NeuroPassEntitlementPolicy';
import { NeuroPassRetroClaimEngine, type RetroClaimResult } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import type { NeuroPassIapRepository } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';

export interface RestoreNeuroPassPurchasesResult {
  restoredSkus: string[];
  retroClaim?: RetroClaimResult;
}

export interface RestoreNeuroPassPurchasesInput {
  seasonId: string;
  currentTier: number;
  tiers: NeuroPassTier[];
}

export class RestoreNeuroPassPurchases {
  constructor(
    private readonly iapRepository: NeuroPassIapRepository,
    private readonly entitlementPolicy: NeuroPassEntitlementPolicy,
    private readonly retroClaimEngine: NeuroPassRetroClaimEngine,
    private readonly skuBuilder: NeuroPassSkuBuilder,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(input: RestoreNeuroPassPurchasesInput): Promise<RestoreNeuroPassPurchasesResult> {
    await this.iapRepository.initialize();

    const purchases = await this.iapRepository.restorePurchases();
    if (purchases.length === 0) {
      return {
        restoredSkus: [],
      };
    }

    const standardSku = this.skuBuilder.buildStandardSku(input.seasonId);
    const plusSku = this.skuBuilder.buildPlusSku(input.seasonId);

    let entitlement = await this.iapRepository.getEntitlement(input.seasonId);
    const restoredSkus: string[] = [];

    for (const purchase of purchases) {
      if (purchase.sku !== standardSku && purchase.sku !== plusSku) {
        continue;
      }

      entitlement = this.entitlementPolicy.applyPurchase(entitlement, {
        seasonId: input.seasonId,
        sku: purchase.sku,
        purchasedAtUtc: new Date(this.now()).toISOString(),
      });

      restoredSkus.push(purchase.sku);
      await this.iapRepository.upsertIapPurchaseRecord({
        transactionId: purchase.transactionId,
        purchaseToken: purchase.purchaseToken,
        sku: purchase.sku,
        seasonId: input.seasonId,
        grantedAtUtc: new Date(this.now()).toISOString(),
      });

      await this.iapRepository.finishTransaction(purchase, false);
    }

    if (restoredSkus.length === 0) {
      return {
        restoredSkus: [],
      };
    }

    entitlement = {
      ...entitlement,
      lastRestoreAtUtc: new Date(this.now()).toISOString(),
    };
    await this.iapRepository.setEntitlement(input.seasonId, entitlement);

    let retroClaim: RetroClaimResult | undefined;
    if (entitlement.premiumOwned) {
      const claimed = await this.iapRepository.getClaimedRewardKeys();
      retroClaim = this.retroClaimEngine.run({
        seasonId: input.seasonId,
        currentTier: input.currentTier,
        tiers: input.tiers,
        existingClaimedRewardKeys: claimed,
      });

      if (retroClaim.unlockedCount > 0) {
        this.analytics.track(neuroPassEvents.retroClaimed, {
          season_id: input.seasonId,
          count: retroClaim.unlockedCount,
        });
      }
    }

    return {
      restoredSkus: Array.from(new Set(restoredSkus)),
      retroClaim,
    };
  }
}
