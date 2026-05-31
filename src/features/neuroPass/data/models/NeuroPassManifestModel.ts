import type { NeuroPassRewardType } from '@features/neuroPass/domain/entities/NeuroPassReward';

export const NEURO_PASS_TIERS_TOTAL = 40;
export const NEURO_PASS_XP_PER_TIER = 500;
export const NEURO_PASS_MIN_SUPPORTED_MANIFEST_VERSION = 1;
export const NEURO_PASS_MILESTONE_TIERS = [5, 10, 20, 30, 40] as const;

export interface NeuroPassRewardSlotModel {
  rewardId: string;
  rewardType: NeuroPassRewardType;
  contentId: string;
  amount: number;
  title: string;
}

export interface NeuroPassMilestoneModel {
  tier: (typeof NEURO_PASS_MILESTONE_TIERS)[number];
  label: string;
  rewardId: string;
}

export interface NeuroPassManifestSkuModel {
  standardSku: string;
  plusSku: string;
  tierSkipSku5: string;
  catchUpBundleSku: string;
}

export interface NeuroPassManifestContentModel {
  musicTrackIds: string[];
  puzzlePackIds: string[];
  bossThemeIds: string[];
  badgeIds: string[];
  metronomeSkinIds: string[];
  profileFrameIds: string[];
}

export interface NeuroPassManifestModel {
  manifestVersion: number;
  minSupportedVersion: number;
  seasonId: string;
  name: string;
  startAt: string;
  endAt: string;
  graceEndAt: string;
  tiersTotal: number;
  xpPerTier: number;
  freeTrack: NeuroPassRewardSlotModel[];
  premiumTrack: NeuroPassRewardSlotModel[];
  milestones: {
    featuredTiers: NeuroPassMilestoneModel[];
  };
  sku: NeuroPassManifestSkuModel;
  content: NeuroPassManifestContentModel;
}

export interface NeuroPassPersistedProgressModel {
  currentNxp: number;
  lastUpdatedAtUtc: string;
}

export interface NeuroPassPersistedEntitlementModel {
  seasonId?: string;
  premiumOwned: boolean;
  passSkuPurchased?: 'standard' | 'plus' | null;
  plusTierSkipsRemaining: number;
  purchasedTierSkipsBalance?: number;
  tierSkipsPurchasedTodayCount?: number;
  bonusUnlockedTiers?: number;
  lastPurchaseAtUtc?: string;
  lastRestoreAtUtc?: string;
  purchasedSkus?: string[];
}

export interface NeuroPassClaimPlaceholderModel {
  claimedRewardKeys: string[];
}

export function toManifestJson(model: NeuroPassManifestModel): string {
  return JSON.stringify(model);
}

export function parseManifestJson(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}
