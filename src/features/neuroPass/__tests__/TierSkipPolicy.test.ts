import { buildDefaultNeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import { NeuroPassTierSkipPolicy } from '@features/neuroPass/domain/iap/NeuroPassTierSkipPolicy';

describe('NeuroPassTierSkipPolicy', () => {
  const policy = new NeuroPassTierSkipPolicy();

  it('enforces daily max 2 for tier_skip_5 purchases', () => {
    expect(policy.canPurchaseTierSkip5(0)).toBe(true);
    expect(policy.canPurchaseTierSkip5(1)).toBe(true);
    expect(policy.canPurchaseTierSkip5(2)).toBe(false);
    expect(policy.canPurchaseTierSkip5(99)).toBe(false);
  });

  it('adds +5 purchased skips per purchase and consumes purchased first', () => {
    const entitlement = buildDefaultNeuroPassEntitlement('neuro_pass_s1');
    const withPlus = {
      ...entitlement,
      plusTierSkipsRemaining: 10,
      purchasedTierSkipsBalance: 0,
    };

    const afterPurchase = policy.applyTierSkipPurchase(withPlus);
    expect(afterPurchase.purchasedTierSkipsBalance).toBe(5);

    const consumeThree = policy.consumeSkips(afterPurchase, 3);
    expect(consumeThree.ok).toBe(true);
    expect(consumeThree.entitlement.purchasedTierSkipsBalance).toBe(2);
    expect(consumeThree.entitlement.plusTierSkipsRemaining).toBe(10);

    const consumeFour = policy.consumeSkips(consumeThree.entitlement, 4);
    expect(consumeFour.ok).toBe(true);
    expect(consumeFour.entitlement.purchasedTierSkipsBalance).toBe(0);
    expect(consumeFour.entitlement.plusTierSkipsRemaining).toBe(8);
  });
});
