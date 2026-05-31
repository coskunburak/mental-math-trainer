import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  hasClaimKeyForTrack,
  type NeuroPassClaimTrack,
} from '@features/neuroPass/domain/idempotency/keys';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';

import { NeuroPassTierCell } from './NeuroPassTierCell';

interface NeuroPassTrackRailProps {
  seasonId: string;
  tiers: NeuroPassTier[];
  premiumOwned: boolean;
  claimedRewardKeys: string[];
  claimingTierKey: string | null;
  onClaimTier?: (tierIndex: number, track: NeuroPassClaimTrack) => void;
  onLockedPremiumPress?: (tierIndex: number) => void;
}

function NeuroPassTrackRailComponent({
  seasonId,
  tiers,
  premiumOwned,
  claimedRewardKeys,
  claimingTierKey,
  onClaimTier,
  onLockedPremiumPress,
}: NeuroPassTrackRailProps) {
  return (
    <View style={styles.content}>
      {tiers.map((item) => (
        <NeuroPassTierCell
          key={`tier-${item.tierIndex}`}
          tier={item}
          premiumOwned={premiumOwned}
          freeClaimed={hasClaimKeyForTrack({
            keys: claimedRewardKeys,
            seasonId,
            tier: item.tierIndex,
            track: 'free',
          })}
          premiumClaimed={hasClaimKeyForTrack({
            keys: claimedRewardKeys,
            seasonId,
            tier: item.tierIndex,
            track: 'premium',
            rewardId: item.premiumReward.id,
          })}
          freeClaiming={claimingTierKey === toTierTrackKey(item.tierIndex, 'free')}
          premiumClaiming={claimingTierKey === toTierTrackKey(item.tierIndex, 'premium')}
          onClaimTier={onClaimTier}
          onLockedPremiumPress={onLockedPremiumPress}
        />
      ))}
    </View>
  );
}

export const NeuroPassTrackRail = memo(NeuroPassTrackRailComponent);

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingBottom: 8,
  },
});

function toTierTrackKey(tierIndex: number, track: NeuroPassClaimTrack): string {
  return `${Math.max(1, Math.floor(tierIndex))}:${track === 'premium' ? 'premium' : 'free'}`;
}
