import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import { totalTierSkipsBalance } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import { NeuroPassTierSkipPolicy } from '@features/neuroPass/domain/iap/NeuroPassTierSkipPolicy';
import type { NeuroPassIapRepository } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';

export interface UseTierSkipInput {
  seasonId: string;
  count?: number;
  currentTierFromNxp: number;
  tiersTotal: number;
}

export interface UseTierSkipResult {
  ok: boolean;
  consumed: number;
  remaining: number;
  effectiveTier: number;
  errorCode?: 'insufficient_balance' | 'season_completed';
}

export class UseTierSkip {
  constructor(
    private readonly iapRepository: NeuroPassIapRepository,
    private readonly tierSkipPolicy: NeuroPassTierSkipPolicy,
    private readonly analytics: AnalyticsService,
  ) {}

  async execute(input: UseTierSkipInput): Promise<UseTierSkipResult> {
    const entitlement = await this.iapRepository.getEntitlement(input.seasonId);
    const requested = Math.max(1, Math.floor(input.count ?? 1));

    const maxBonusAllowed = Math.max(0, Math.floor(input.tiersTotal) - Math.floor(input.currentTierFromNxp));
    const currentBonus = Math.max(0, Math.floor(entitlement.bonusUnlockedTiers));
    const bonusCapacity = Math.max(0, maxBonusAllowed - currentBonus);

    if (bonusCapacity <= 0) {
      return {
        ok: false,
        consumed: 0,
        remaining: totalTierSkipsBalance(entitlement),
        effectiveTier: Math.min(input.tiersTotal, input.currentTierFromNxp + currentBonus),
        errorCode: 'season_completed',
      };
    }

    const safeCount = Math.min(requested, bonusCapacity);
    const consume = this.tierSkipPolicy.consumeSkips(entitlement, safeCount);

    if (!consume.ok) {
      return {
        ok: false,
        consumed: 0,
        remaining: totalTierSkipsBalance(entitlement),
        effectiveTier: Math.min(input.tiersTotal, input.currentTierFromNxp + currentBonus),
        errorCode: 'insufficient_balance',
      };
    }

    const boundedBonus = Math.min(maxBonusAllowed, consume.entitlement.bonusUnlockedTiers);
    const nextEntitlement = {
      ...consume.entitlement,
      bonusUnlockedTiers: boundedBonus,
    };

    await this.iapRepository.setEntitlement(input.seasonId, nextEntitlement);

    const remaining = totalTierSkipsBalance(nextEntitlement);
    const effectiveTier = Math.min(input.tiersTotal, input.currentTierFromNxp + boundedBonus);

    this.analytics.track(neuroPassEvents.tierSkipUsed, {
      season_id: input.seasonId,
      count: consume.consumed,
      remaining,
    });

    return {
      ok: true,
      consumed: consume.consumed,
      remaining,
      effectiveTier,
    };
  }
}
