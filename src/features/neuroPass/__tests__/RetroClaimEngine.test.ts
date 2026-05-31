import { NeuroPassRetroClaimEngine } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import type { NeuroPassRewardType } from '@features/neuroPass/domain/entities/NeuroPassReward';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';

function buildTier(tierIndex: number, premiumType: NeuroPassRewardType): NeuroPassTier {
  return {
    tierIndex,
    freeReward: {
      id: `free_${tierIndex}`,
      type: 'coins',
      contentId: `free_${tierIndex}`,
      amount: 10,
      title: `Free ${tierIndex}`,
    },
    premiumReward: {
      id: `premium_${tierIndex}`,
      type: premiumType,
      contentId: `premium_${tierIndex}`,
      amount: 1,
      title: `Premium ${tierIndex}`,
    },
    isMilestone: false,
    isUnlockedByProgress: false,
  };
}

describe('NeuroPassRetroClaimEngine', () => {
  it('retro-unlocks all premium rewards up to current tier and summarizes types', () => {
    const engine = new NeuroPassRetroClaimEngine();
    const tiers = [
      buildTier(1, 'coins'),
      buildTier(2, 'track_fragment'),
      buildTier(3, 'music_track'),
      buildTier(4, 'coins'),
    ];

    const result = engine.run({
      seasonId: 'neuro_pass_s1',
      currentTier: 3,
      tiers,
      existingClaimedRewardKeys: [],
    });

    expect(result.unlockedCount).toBe(3);
    expect(result.unlockedTiers).toEqual([1, 2, 3]);
    expect(result.unlockedRewardTypesSummary.coins).toBe(1);
    expect(result.unlockedRewardTypesSummary.track_fragment).toBe(1);
    expect(result.unlockedRewardTypesSummary.music_track).toBe(1);
  });

  it('does not duplicate already-claimed rewards', () => {
    const engine = new NeuroPassRetroClaimEngine();
    const tiers = [buildTier(1, 'coins'), buildTier(2, 'coins')];

    const result = engine.run({
      seasonId: 'neuro_pass_s1',
      currentTier: 2,
      tiers,
      existingClaimedRewardKeys: ['premium:neuro_pass_s1:tier:1:premium_1'],
    });

    expect(result.unlockedCount).toBe(1);
    expect(result.unlockedTiers).toEqual([2]);
  });
});
