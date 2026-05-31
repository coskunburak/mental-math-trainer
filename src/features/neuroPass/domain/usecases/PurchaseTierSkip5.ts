import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import { NeuroPassTierSkipPolicy } from '@features/neuroPass/domain/iap/NeuroPassTierSkipPolicy';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import type { NeuroPassIapRepository } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';
import { utcDayKey } from '@features/neuroPass/domain/utils/time';

export interface PurchaseTierSkip5Result {
  status: 'success' | 'cancelled' | 'failed';
  grantedSkips: number;
  dayCount: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface PurchaseTierSkip5Input {
  seasonId: string;
  price?: number | null;
  currency?: string;
}

export class PurchaseTierSkip5 {
  constructor(
    private readonly iapRepository: NeuroPassIapRepository,
    private readonly tierSkipPolicy: NeuroPassTierSkipPolicy,
    private readonly skuBuilder: NeuroPassSkuBuilder,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(input: PurchaseTierSkip5Input): Promise<PurchaseTierSkip5Result> {
    const nowUtc = new Date(this.now());
    const dayKey = utcDayKey(nowUtc);

    const todayCount = await this.iapRepository.getTierSkipDailyCounter(dayKey);
    if (!this.tierSkipPolicy.canPurchaseTierSkip5(todayCount)) {
      return {
        status: 'failed',
        grantedSkips: 0,
        dayCount: todayCount,
        errorCode: 'daily_limit_reached',
        errorMessage: 'tier_skip_daily_limit_reached',
      };
    }

    await this.iapRepository.initialize();

    const sku = this.skuBuilder.tierSkipSku5;
    let transaction;

    try {
      transaction = await this.iapRepository.requestPurchase(sku);
    } catch (error) {
      const parsed = parsePurchaseError(error);
      return {
        status: parsed.cancelled ? 'cancelled' : 'failed',
        grantedSkips: 0,
        dayCount: todayCount,
        errorCode: parsed.code,
        errorMessage: parsed.message,
      };
    }

    const existingRecords = await this.iapRepository.getIapPurchaseRecords();
    const duplicate = existingRecords.some((record) =>
      record.transactionId === transaction.transactionId
      || (record.purchaseToken.length > 0 && record.purchaseToken === transaction.purchaseToken),
    );

    let nextDayCount = todayCount;

    if (!duplicate) {
      const entitlement = await this.iapRepository.getEntitlement(input.seasonId);
      const updated = this.tierSkipPolicy.applyTierSkipPurchase(entitlement);
      nextDayCount = todayCount + 1;
      await this.iapRepository.setEntitlement(input.seasonId, {
        ...updated,
        tierSkipsPurchasedTodayCount: nextDayCount,
        lastPurchaseAtUtc: nowUtc.toISOString(),
      });

      await this.iapRepository.setTierSkipDailyCounter(dayKey, nextDayCount);

      await this.iapRepository.upsertIapPurchaseRecord({
        transactionId: transaction.transactionId,
        purchaseToken: transaction.purchaseToken,
        sku,
        seasonId: input.seasonId,
        grantedAtUtc: nowUtc.toISOString(),
      });
    }

    await this.iapRepository.finishTransaction(transaction, true);

    this.analytics.track(neuroPassEvents.purchaseCompleted, {
      season_id: input.seasonId,
      sku,
      price: input.price ?? undefined,
      currency: input.currency ?? undefined,
    });

    this.analytics.track(neuroPassEvents.tierSkipPurchased, {
      season_id: input.seasonId,
      count: 5,
      day_count: nextDayCount,
    });

    return {
      status: 'success',
      grantedSkips: duplicate ? 0 : 5,
      dayCount: nextDayCount,
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

  return {
    cancelled: code === 'E_USER_CANCELLED' || /cancel/i.test(message ?? ''),
    code,
    message,
  };
}
