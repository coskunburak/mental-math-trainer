import { neuroPassEvents } from '@core/analytics/events';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import { LocalNeuroPassClaimsRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassClaimsRepository';
import type { NeuroPassRewardType } from '@features/neuroPass/domain/entities/NeuroPassReward';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import { makeLegacyPremiumClaimKey } from '@features/neuroPass/domain/idempotency/keys';
import { ClaimTierReward } from '@features/neuroPass/domain/usecases/ClaimTierReward';

import { InMemoryKeyValueStore } from './testUtils';
import { createAnalyticsService } from './xpTestUtils';

function buildTier(tierIndex: number, premiumType: NeuroPassRewardType): NeuroPassTier {
  return {
    tierIndex,
    freeReward: {
      id: `free_${tierIndex}`,
      type: 'coins',
      contentId: `free_coins_${tierIndex}`,
      amount: 120,
      title: `Free Coins ${tierIndex}`,
    },
    premiumReward: {
      id: `premium_${tierIndex}`,
      type: premiumType,
      contentId: `${premiumType}_${tierIndex}`,
      amount: premiumType === 'coins' ? 400 : 1,
      title: `Premium ${tierIndex}`,
    },
    isMilestone: false,
    isUnlockedByProgress: true,
  };
}

describe('ClaimTierReward', () => {
  it('claims free reward and persists inventory + claim key', async () => {
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const claimsRepository = new LocalNeuroPassClaimsRepository(store);
    const analytics = createAnalyticsService();
    const claimTierReward = new ClaimTierReward(claimsRepository, store, analytics.service);

    const result = await claimTierReward.execute({
      seasonId: 'neuro_pass_s1',
      tier: buildTier(3, 'coins'),
      track: 'free',
      effectiveTier: 3,
      premiumOwned: false,
    });

    expect(result.ok).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.inventory.coins).toBe(120);
    expect(await claimsRepository.hasClaimKey('neuro_pass_s1:3:free')).toBe(true);
    expect(
      analytics.client.events.some((event) => event.name === neuroPassEvents.tierClaimed),
    ).toBe(true);
  });

  it('blocks duplicate claims idempotently', async () => {
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const claimsRepository = new LocalNeuroPassClaimsRepository(store);
    const analytics = createAnalyticsService();
    const claimTierReward = new ClaimTierReward(claimsRepository, store, analytics.service);
    const tier = buildTier(2, 'coins');

    await claimTierReward.execute({
      seasonId: 'neuro_pass_s1',
      tier,
      track: 'free',
      effectiveTier: 2,
      premiumOwned: false,
    });

    const second = await claimTierReward.execute({
      seasonId: 'neuro_pass_s1',
      tier,
      track: 'free',
      effectiveTier: 2,
      premiumOwned: false,
    });

    expect(second.ok).toBe(false);
    expect(second.blocked).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(second.reason).toBe('already_claimed');
    expect(second.inventory.coins).toBe(120);
  });

  it('requires premium ownership for premium track claims', async () => {
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const claimsRepository = new LocalNeuroPassClaimsRepository(store);
    const analytics = createAnalyticsService();
    const claimTierReward = new ClaimTierReward(claimsRepository, store, analytics.service);

    const result = await claimTierReward.execute({
      seasonId: 'neuro_pass_s1',
      tier: buildTier(5, 'coins'),
      track: 'premium',
      effectiveTier: 5,
      premiumOwned: false,
    });

    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('premium_required');
    expect(result.inventory.coins).toBe(0);
  });

  it('treats legacy premium claim keys as already claimed', async () => {
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const claimsRepository = new LocalNeuroPassClaimsRepository(store);
    const analytics = createAnalyticsService();
    const claimTierReward = new ClaimTierReward(claimsRepository, store, analytics.service);
    const tier = buildTier(7, 'coins');

    await claimsRepository.setClaimedRewardKeys([
      makeLegacyPremiumClaimKey('neuro_pass_s1', 7, tier.premiumReward.id),
    ]);

    const result = await claimTierReward.execute({
      seasonId: 'neuro_pass_s1',
      tier,
      track: 'premium',
      effectiveTier: 7,
      premiumOwned: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(result.reason).toBe('already_claimed');
    expect(result.inventory.coins).toBe(0);
  });

  it('blocks claims for locked tiers', async () => {
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const claimsRepository = new LocalNeuroPassClaimsRepository(store);
    const analytics = createAnalyticsService();
    const claimTierReward = new ClaimTierReward(claimsRepository, store, analytics.service);

    const result = await claimTierReward.execute({
      seasonId: 'neuro_pass_s1',
      tier: buildTier(9, 'music_track'),
      track: 'free',
      effectiveTier: 4,
      premiumOwned: false,
    });

    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('tier_locked');
  });
});
