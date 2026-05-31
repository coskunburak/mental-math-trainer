import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import {
  makeClaimKey,
  makeLegacyPremiumClaimKey,
} from '@features/neuroPass/domain/idempotency/keys';

export interface RetroClaimResult {
  unlockedCount: number;
  unlockedTiers: number[];
  unlockedRewardTypesSummary: Record<string, number>;
  highlightedRewards: string[];
  claimedRewardKeys: string[];
}

export class NeuroPassRetroClaimEngine {
  run(input: {
    seasonId: string;
    currentTier: number;
    tiers: NeuroPassTier[];
    existingClaimedRewardKeys: string[];
  }): RetroClaimResult {
    const tierCap = Math.max(1, Math.floor(input.currentTier));
    const claimSet = new Set(
      input.existingClaimedRewardKeys.filter((item) => typeof item === 'string' && item.trim().length > 0),
    );

    const unlockedTiers: number[] = [];
    const rewardTypeSummary: Record<string, number> = {};
    const highlightedRewards: string[] = [];

    input.tiers.forEach((tier) => {
      if (tier.tierIndex > tierCap) {
        return;
      }

      const key = retroClaimKey(input.seasonId, tier.tierIndex, tier.premiumReward.id);
      const legacyKey = makeLegacyPremiumClaimKey(input.seasonId, tier.tierIndex, tier.premiumReward.id);
      if (claimSet.has(key) || claimSet.has(legacyKey)) {
        return;
      }

      claimSet.add(key);
      unlockedTiers.push(tier.tierIndex);
      rewardTypeSummary[tier.premiumReward.type] = (rewardTypeSummary[tier.premiumReward.type] ?? 0) + 1;

      if (highlightedRewards.length < 4 && tier.premiumReward.title.trim().length > 0) {
        highlightedRewards.push(tier.premiumReward.title);
      }
    });

    return {
      unlockedCount: unlockedTiers.length,
      unlockedTiers,
      unlockedRewardTypesSummary: rewardTypeSummary,
      highlightedRewards,
      claimedRewardKeys: Array.from(claimSet).slice(-600),
    };
  }
}

export function retroClaimKey(seasonId: string, tierIndex: number, rewardId: string): string {
  void rewardId;
  return makeClaimKey(seasonId, tierIndex, 'premium');
}

function legacyRetroClaimKey(seasonId: string, tierIndex: number, rewardId: string): string {
  return makeLegacyPremiumClaimKey(seasonId, tierIndex, rewardId);
}
