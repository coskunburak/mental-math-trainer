export type SubscriptionTier = 'free' | 'premium';

export interface MonetizationProfile {
  tier: SubscriptionTier;
  premiumActivatedAt: number | null;
  rewardedAdsWatched: number;
  rewardedXpClaimed: number;
  lastRewardedSessionId: string | null;
}

export interface PremiumEntitlements {
  advancedInsights: boolean;
  noAds: boolean;
  unlimitedPractice: boolean;
  customTraining: boolean;
}

export function buildEntitlements(tier: SubscriptionTier): PremiumEntitlements {
  const premium = tier === 'premium';

  return {
    advancedInsights: premium,
    noAds: premium,
    unlimitedPractice: premium,
    customTraining: premium,
  };
}

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === 'premium';
}
