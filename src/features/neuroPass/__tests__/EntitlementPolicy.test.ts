import { buildDefaultNeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import { NeuroPassEntitlementPolicy } from '@features/neuroPass/domain/iap/NeuroPassEntitlementPolicy';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';

describe('NeuroPassEntitlementPolicy', () => {
  const skuBuilder = new NeuroPassSkuBuilder();
  const policy = new NeuroPassEntitlementPolicy(skuBuilder);

  it('applies standard purchase as premium-owned for the season', () => {
    const seasonId = 'neuro_pass_s1';
    const entitlement = buildDefaultNeuroPassEntitlement(seasonId);

    const updated = policy.applyPurchase(entitlement, {
      seasonId,
      sku: skuBuilder.buildStandardSku(seasonId),
      purchasedAtUtc: '2026-02-21T00:00:00.000Z',
    });

    expect(updated.premiumOwned).toBe(true);
    expect(updated.passSkuPurchased).toBe('standard');
    expect(updated.plusTierSkipsRemaining).toBe(0);
  });

  it('applies plus purchase and ensures +10 skips', () => {
    const seasonId = 'neuro_pass_s1';
    const entitlement = {
      ...buildDefaultNeuroPassEntitlement(seasonId),
      plusTierSkipsRemaining: 1,
    };

    const updated = policy.applyPurchase(entitlement, {
      seasonId,
      sku: skuBuilder.buildPlusSku(seasonId),
      purchasedAtUtc: '2026-02-21T00:00:00.000Z',
    });

    expect(updated.premiumOwned).toBe(true);
    expect(updated.passSkuPurchased).toBe('plus');
    expect(updated.plusTierSkipsRemaining).toBeGreaterThanOrEqual(10);
  });
});
