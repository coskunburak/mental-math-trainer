import { clampInt } from '@features/neuroPass/domain/utils/math';

export type NeuroPassClaimTrack = 'free' | 'premium';

export function makeXpGrantIdFromRun(runId: string): string {
  return runId.trim().slice(0, 96);
}

export function makeClaimKey(
  seasonId: string,
  tier: number,
  track: NeuroPassClaimTrack,
): string {
  const normalizedSeason = seasonId.trim().slice(0, 64) || 'unknown_season';
  const normalizedTier = clampInt(tier, 1, 999);
  const normalizedTrack = track === 'premium' ? 'premium' : 'free';
  return `${normalizedSeason}:${normalizedTier}:${normalizedTrack}`;
}

export function makeLegacyPremiumClaimKey(
  seasonId: string,
  tier: number,
  rewardId: string,
): string {
  const normalizedSeason = seasonId.trim().slice(0, 64) || 'unknown_season';
  const normalizedTier = clampInt(tier, 1, 999);
  const normalizedRewardId = rewardId.trim().slice(0, 80) || 'unknown_reward';
  return `premium:${normalizedSeason}:tier:${normalizedTier}:${normalizedRewardId}`;
}

export function hasClaimKeyForTrack(input: {
  keys: string[];
  seasonId: string;
  tier: number;
  track: NeuroPassClaimTrack;
  rewardId?: string;
}): boolean {
  const keySet = new Set(
    input.keys
      .filter((key) => typeof key === 'string')
      .map((key) => key.trim())
      .filter((key) => key.length > 0),
  );
  const normalized = makeClaimKey(input.seasonId, input.tier, input.track);
  if (keySet.has(normalized)) {
    return true;
  }

  if (input.track === 'premium' && typeof input.rewardId === 'string' && input.rewardId.trim().length > 0) {
    return keySet.has(makeLegacyPremiumClaimKey(input.seasonId, input.tier, input.rewardId));
  }

  return false;
}
