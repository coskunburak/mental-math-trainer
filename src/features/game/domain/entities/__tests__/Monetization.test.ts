import { buildEntitlements, isPremiumTier } from '../Monetization';

describe('Monetization', () => {
  it('returns locked entitlements for free users', () => {
    const entitlements = buildEntitlements('free');

    expect(entitlements.advancedInsights).toBe(false);
    expect(entitlements.customTraining).toBe(false);
    expect(entitlements.noAds).toBe(false);
    expect(entitlements.unlimitedPractice).toBe(false);
  });

  it('returns full entitlements for premium users', () => {
    const entitlements = buildEntitlements('premium');

    expect(entitlements.advancedInsights).toBe(true);
    expect(entitlements.customTraining).toBe(true);
    expect(entitlements.noAds).toBe(true);
    expect(entitlements.unlimitedPractice).toBe(true);
    expect(isPremiumTier('premium')).toBe(true);
  });
});
