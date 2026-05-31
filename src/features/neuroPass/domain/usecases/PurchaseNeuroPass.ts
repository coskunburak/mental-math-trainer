import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import { NeuroPassEntitlementPolicy, type NeuroPassPlan } from '@features/neuroPass/domain/iap/NeuroPassEntitlementPolicy';
import { NeuroPassRetroClaimEngine, type RetroClaimResult } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import type { NeuroPassIapRepository } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';

export interface NeuroPassPurchaseResult {
  status: 'success' | 'cancelled' | 'failed';
  sku: string;
  seasonId: string;
  errorCode?: string;
  errorMessage?: string;
  retroClaim?: RetroClaimResult;
}

export interface PurchaseNeuroPassInput {
  seasonId: string;
  plan: NeuroPassPlan;
  source: 'screen_cta' | 'tier_locked' | 'sheet';
  currentTier: number;
  tiers: NeuroPassTier[];
  price?: number | null;
  currency?: string;
}

export class PurchaseNeuroPass {
  constructor(
    private readonly iapRepository: NeuroPassIapRepository,
    private readonly entitlementPolicy: NeuroPassEntitlementPolicy,
    private readonly retroClaimEngine: NeuroPassRetroClaimEngine,
    private readonly skuBuilder: NeuroPassSkuBuilder,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(input: PurchaseNeuroPassInput): Promise<NeuroPassPurchaseResult> {
    const sku = input.plan === 'plus'
      ? this.skuBuilder.buildPlusSku(input.seasonId)
      : this.skuBuilder.buildStandardSku(input.seasonId);

    this.analytics.track(neuroPassEvents.purchaseCtaTap, {
      season_id: input.seasonId,
      sku,
      source: input.source,
    });

    await this.iapRepository.initialize();

    let transaction;
    try {
      transaction = await this.iapRepository.requestPurchase(sku);
    } catch (error) {
      const parsed = parsePurchaseError(error);
      return {
        status: parsed.cancelled ? 'cancelled' : 'failed',
        sku,
        seasonId: input.seasonId,
        errorCode: parsed.code,
        errorMessage: parsed.message,
      };
    }

    const existingRecords = await this.iapRepository.getIapPurchaseRecords();
    const isDuplicate = existingRecords.some((record) =>
      record.transactionId === transaction.transactionId
      || (record.purchaseToken.length > 0 && record.purchaseToken === transaction.purchaseToken),
    );

    let entitlement = await this.iapRepository.getEntitlement(input.seasonId);

    if (!isDuplicate) {
      entitlement = this.entitlementPolicy.applyPurchase(entitlement, {
        seasonId: input.seasonId,
        sku,
        purchasedAtUtc: new Date(this.now()).toISOString(),
      });

      await this.iapRepository.setEntitlement(input.seasonId, entitlement);
      await this.iapRepository.upsertIapPurchaseRecord({
        transactionId: transaction.transactionId,
        purchaseToken: transaction.purchaseToken,
        sku,
        seasonId: input.seasonId,
        grantedAtUtc: new Date(this.now()).toISOString(),
      });
    }

    await this.iapRepository.finishTransaction(transaction, false);

    let retroClaim: RetroClaimResult | undefined;
    if (entitlement.premiumOwned) {
      const existingClaimed = await this.iapRepository.getClaimedRewardKeys();
      retroClaim = this.retroClaimEngine.run({
        seasonId: input.seasonId,
        currentTier: input.currentTier,
        tiers: input.tiers,
        existingClaimedRewardKeys: existingClaimed,
      });

      if (retroClaim.unlockedCount > 0) {
        this.analytics.track(neuroPassEvents.retroClaimed, {
          season_id: input.seasonId,
          count: retroClaim.unlockedCount,
        });
      }
    }

    this.analytics.track(neuroPassEvents.purchaseCompleted, {
      season_id: input.seasonId,
      sku,
      price: input.price ?? undefined,
      currency: input.currency ?? undefined,
    });

    return {
      status: 'success',
      sku,
      seasonId: input.seasonId,
      retroClaim,
    };
  }
}

function parsePurchaseError(error: unknown): { cancelled: boolean; code?: string; message?: string } {
  if (!error || typeof error !== 'object') {
    return {
      cancelled: false,
      message: 'unknown_error',
    };
  }

  const record = error as Record<string, unknown>;
  const code = typeof record.code === 'string' ? record.code : undefined;
  const message = typeof record.message === 'string' ? record.message : undefined;

  const cancelledByCode = code === 'E_USER_CANCELLED' || code === 'user_cancelled';
  const cancelledByMessage = typeof message === 'string' && /cancel/i.test(message);

  return {
    cancelled: cancelledByCode || cancelledByMessage,
    code,
    message,
  };
}
