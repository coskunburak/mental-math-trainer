import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassInventory } from '@features/neuroPass/domain/entities/NeuroPassInventory';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import {
  hasClaimKeyForTrack,
  makeClaimKey,
  type NeuroPassClaimTrack,
} from '@features/neuroPass/domain/idempotency/keys';
import type { NeuroPassClaimsRepository } from '@features/neuroPass/domain/repositories/NeuroPassClaimsRepository';

export type ClaimTierRewardBlockReason =
  | 'tier_locked'
  | 'premium_required'
  | 'already_claimed'
  | 'invalid_tier';

export interface ClaimTierRewardInput {
  seasonId: string;
  tier: NeuroPassTier;
  track: NeuroPassClaimTrack;
  effectiveTier: number;
  premiumOwned: boolean;
}

export interface ClaimTierRewardResult {
  ok: boolean;
  blocked: boolean;
  duplicate: boolean;
  reason?: ClaimTierRewardBlockReason;
  claimKey: string;
  tierIndex: number;
  track: NeuroPassClaimTrack;
  inventory: NeuroPassInventory;
  reward: NeuroPassTier['freeReward'] | null;
}

export class ClaimTierReward {
  constructor(
    private readonly claimsRepository: NeuroPassClaimsRepository,
    private readonly localStore: NeuroPassLocalStore,
    private readonly analytics: AnalyticsService,
  ) {}

  async execute(input: ClaimTierRewardInput): Promise<ClaimTierRewardResult> {
    const seasonId = input.seasonId.trim();
    const tierIndex = Math.max(1, Math.floor(input.tier.tierIndex));
    const claimKey = makeClaimKey(seasonId, tierIndex, input.track);
    const reward = input.track === 'premium' ? input.tier.premiumReward : input.tier.freeReward;

    if (!seasonId || !Number.isFinite(tierIndex) || tierIndex <= 0) {
      return this.buildBlockedResult({
        input,
        reward,
        claimKey,
        reason: 'invalid_tier',
      });
    }

    if (tierIndex > Math.max(1, Math.floor(input.effectiveTier))) {
      return this.buildBlockedResult({
        input,
        reward,
        claimKey,
        reason: 'tier_locked',
      });
    }

    if (input.track === 'premium' && !input.premiumOwned) {
      return this.buildBlockedResult({
        input,
        reward,
        claimKey,
        reason: 'premium_required',
      });
    }

    const existingKeys = await this.claimsRepository.getClaimedRewardKeys();
    if (
      hasClaimKeyForTrack({
        keys: existingKeys,
        seasonId,
        tier: tierIndex,
        track: input.track,
        rewardId: reward.id,
      })
    ) {
      return this.buildBlockedResult({
        input,
        reward,
        claimKey,
        reason: 'already_claimed',
        duplicate: true,
      });
    }

    const inventory = await this.localStore.applyRewardToInventory(reward);
    await this.claimsRepository.addClaimKey(claimKey);

    this.analytics.track(neuroPassEvents.tierClaimed, {
      season_id: seasonId,
      tier: tierIndex,
      track: input.track,
      reward_id: reward.id,
      reward_type: reward.type,
      reward_amount: reward.amount,
      total_coins: inventory.coins,
      total_fragments: inventory.trackFragments,
    });

    return {
      ok: true,
      blocked: false,
      duplicate: false,
      claimKey,
      tierIndex,
      track: input.track,
      inventory,
      reward,
    };
  }

  private async buildBlockedResult(input: {
    input: ClaimTierRewardInput;
    reward: NeuroPassTier['freeReward'];
    claimKey: string;
    reason: ClaimTierRewardBlockReason;
    duplicate?: boolean;
  }): Promise<ClaimTierRewardResult> {
    return {
      ok: false,
      blocked: true,
      duplicate: Boolean(input.duplicate),
      reason: input.reason,
      claimKey: input.claimKey,
      tierIndex: input.input.tier.tierIndex,
      track: input.input.track,
      inventory: await this.localStore.readInventory(),
      reward: input.reward,
    };
  }
}
