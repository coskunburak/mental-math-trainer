import {
  type ThemeAccessContext,
  type ThemeUnlockRule,
} from '@features/theme/domain/entities/GameTheme';

import { getThemeById } from '../themeCatalog';
import { resolveThemeSelection } from '../themeCatalogService';
import { evaluateThemeUnlock } from '../themeUnlockEvaluator';

const baseContext: ThemeAccessContext = {
  tier: 'free',
  streakDays: 0,
  referralCount: 0,
  purchasedThemeIds: [],
  activeSeasonIds: [],
  activeCampaignIds: [],
  collabPassIds: [],
  now: Date.parse('2026-02-20T00:00:00.000Z'),
};

describe('themeUnlockEvaluator', () => {
  it('evaluates premium and free requirements', () => {
    expect(evaluateThemeUnlock({ type: 'free' }, baseContext).unlocked).toBe(true);
    expect(evaluateThemeUnlock({ type: 'premium' }, baseContext).unlocked).toBe(false);

    const premiumContext: ThemeAccessContext = {
      ...baseContext,
      tier: 'premium',
    };

    expect(evaluateThemeUnlock({ type: 'premium' }, premiumContext).unlocked).toBe(true);
  });

  it('evaluates streak and referral requirements', () => {
    const streakRule: ThemeUnlockRule = {
      type: 'streak',
      minDays: 7,
    };
    const referralRule: ThemeUnlockRule = {
      type: 'referral',
      minReferrals: 2,
    };

    expect(evaluateThemeUnlock(streakRule, baseContext).unlocked).toBe(false);
    expect(evaluateThemeUnlock(referralRule, baseContext).unlocked).toBe(false);

    const unlockedContext: ThemeAccessContext = {
      ...baseContext,
      streakDays: 9,
      referralCount: 2,
    };

    expect(evaluateThemeUnlock(streakRule, unlockedContext).unlocked).toBe(true);
    expect(evaluateThemeUnlock(referralRule, unlockedContext).unlocked).toBe(true);
  });

  it('evaluates limited campaign windows', () => {
    const limitedRule: ThemeUnlockRule = {
      type: 'limited_time',
      campaignId: 'festival_drop_2026',
      startsAtUtc: '2026-03-01T00:00:00.000Z',
      endsAtUtc: '2026-04-15T23:59:59.000Z',
    };

    expect(evaluateThemeUnlock(limitedRule, baseContext).unlocked).toBe(false);

    const activeContext: ThemeAccessContext = {
      ...baseContext,
      now: Date.parse('2026-03-12T10:00:00.000Z'),
      activeCampaignIds: ['festival_drop_2026'],
    };

    expect(evaluateThemeUnlock(limitedRule, activeContext).unlocked).toBe(true);
  });

  it('supports any_of and all_of rules', () => {
    const anyOfRule: ThemeUnlockRule = {
      type: 'any_of',
      rules: [{ type: 'premium' }, { type: 'referral', minReferrals: 2 }],
    };

    const allOfRule: ThemeUnlockRule = {
      type: 'all_of',
      rules: [
        { type: 'streak', minDays: 7 },
        { type: 'one_time_purchase', productId: 'theme_pack_arcade_retro' },
      ],
    };

    const partiallyUnlocked: ThemeAccessContext = {
      ...baseContext,
      referralCount: 2,
      streakDays: 9,
    };

    expect(evaluateThemeUnlock(anyOfRule, partiallyUnlocked).unlocked).toBe(true);
    expect(evaluateThemeUnlock(allOfRule, partiallyUnlocked).unlocked).toBe(false);

    const fullyUnlocked: ThemeAccessContext = {
      ...partiallyUnlocked,
      purchasedThemeIds: ['theme_pack_arcade_retro'],
    };

    expect(evaluateThemeUnlock(allOfRule, fullyUnlocked).unlocked).toBe(true);
  });

  it('falls back to free theme when requested selection is locked', () => {
    const lockedThemeId = 'cyber-neon';
    const resolved = resolveThemeSelection(lockedThemeId, baseContext);

    expect(resolved.id).not.toBe(lockedThemeId);
    expect(resolved.category).toBe('free');
  });

  it('keeps selected theme when unlocked', () => {
    const labMode = getThemeById('lab-mode');
    expect(labMode).toBeDefined();

    const context: ThemeAccessContext = {
      ...baseContext,
      streakDays: 10,
    };

    const resolved = resolveThemeSelection('lab-mode', context);
    expect(resolved.id).toBe('lab-mode');
  });
});
