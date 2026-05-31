import { buildNeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';
import { buildDefaultNeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';
import { NeuroPassOfferEngine } from '@features/neuroPass/domain/economy/NeuroPassOfferEngine';

function createDashboard(input: {
  state?: NeuroPassDashboard['state'];
  dayLeft?: number;
  timeLeftMs?: number;
  effectiveTier?: number;
  premiumOwned?: boolean;
}): NeuroPassDashboard {
  return {
    status: 'ready',
    season: {
      id: 'neuro_pass_s1',
      name: 'Season 1',
      startAtUtc: new Date('2026-02-01T00:00:00.000Z'),
      endAtUtc: new Date('2026-03-01T00:00:00.000Z'),
      graceEndAtUtc: new Date('2026-03-08T00:00:00.000Z'),
      tiersTotal: 40,
      xpPerTier: 500,
      state: input.state ?? 'active',
    },
    tiers: new Array(40).fill(null).map((_, index) => ({
      tierIndex: index + 1,
      freeReward: {
        id: `f_${index + 1}`,
        type: 'coins',
        contentId: `coins_${index + 1}`,
        amount: 10,
        title: 'Coins',
      },
      premiumReward: {
        id: `p_${index + 1}`,
        type: 'track_fragment',
        contentId: `track_${index + 1}`,
        amount: 1,
        title: 'Track',
      },
      isMilestone: [5, 10, 20, 30, 40].includes(index + 1),
      isUnlockedByProgress: index + 1 <= (input.effectiveTier ?? 30),
    })),
    progress: buildNeuroPassProgress({
      currentNxp: 9000,
      lastUpdatedAtUtc: '2026-02-20T00:00:00.000Z',
      xpPerTier: 500,
      tiersTotal: 40,
    }),
    effectiveTier: input.effectiveTier ?? 30,
    bonusUnlockedTiers: 0,
    tierSkipsBalance: 0,
    entitlement: {
      ...buildDefaultNeuroPassEntitlement('neuro_pass_s1'),
      premiumOwned: Boolean(input.premiumOwned),
    },
    timeLeftMs: input.timeLeftMs ?? 36 * 60 * 60 * 1000,
    dayLeft: input.dayLeft ?? 2,
    state: input.state ?? 'active',
  };
}

describe('NeuroPassOfferEngine', () => {
  it('shows catch-up offer only in last 5 days with >=3 tiers left', () => {
    const engine = new NeuroPassOfferEngine();

    const eligible = engine.buildCatchUpOffer(
      createDashboard({ state: 'active', dayLeft: 4, effectiveTier: 34 }),
    );
    const tooLate = engine.buildCatchUpOffer(
      createDashboard({ state: 'active', dayLeft: 8, effectiveTier: 34 }),
    );
    const nearComplete = engine.buildCatchUpOffer(
      createDashboard({ state: 'active', dayLeft: 2, effectiveTier: 38 }),
    );

    expect(eligible.visible).toBe(true);
    expect(eligible.tiersLeft).toBe(6);
    expect(tooLate.visible).toBe(false);
    expect(nearComplete.visible).toBe(false);
  });

  it('shows urgency only in last 48 hours of active state', () => {
    const engine = new NeuroPassOfferEngine();

    const urgent = engine.buildUrgencyState(createDashboard({ state: 'active', timeLeftMs: 20 * 60 * 60 * 1000 }));
    const notUrgent = engine.buildUrgencyState(createDashboard({ state: 'active', timeLeftMs: 70 * 60 * 60 * 1000 }));
    const grace = engine.buildUrgencyState(createDashboard({ state: 'grace', timeLeftMs: 20 * 60 * 60 * 1000 }));

    expect(urgent.visible).toBe(true);
    expect(urgent.hoursLeft).toBe(20);
    expect(notUrgent.visible).toBe(false);
    expect(grace.visible).toBe(false);
  });
});
