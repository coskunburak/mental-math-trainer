import type {
  ThemeAccessContext,
  ThemeAccessResult,
  ThemeUnlockRule,
} from '@features/theme/domain/entities/GameTheme';

function success(reason: string): ThemeAccessResult {
  return {
    unlocked: true,
    reason,
  };
}

function failure(reason: string): ThemeAccessResult {
  return {
    unlocked: false,
    reason,
  };
}

export function evaluateThemeUnlock(
  rule: ThemeUnlockRule,
  context: ThemeAccessContext,
): ThemeAccessResult {
  switch (rule.type) {
    case 'free':
      return success('Free theme');
    case 'premium':
      return context.tier === 'premium'
        ? success('Included in subscription')
        : failure('Premium subscription required');
    case 'streak':
      return context.streakDays >= rule.minDays
        ? success(`Unlocked by ${rule.minDays}-day streak`)
        : failure(`${rule.minDays}-day streak required`);
    case 'referral':
      return context.referralCount >= rule.minReferrals
        ? success(`Unlocked by ${rule.minReferrals} referrals`)
        : failure(`${rule.minReferrals} referrals required`);
    case 'seasonal':
      return context.activeSeasonIds.includes(rule.seasonId)
        ? success('Seasonal event active')
        : failure('Seasonal event required');
    case 'limited_time': {
      const now = context.now ?? Date.now();
      const startsAt = Date.parse(rule.startsAtUtc);
      const endsAt = Date.parse(rule.endsAtUtc);
      const inWindow =
        Number.isFinite(startsAt) && Number.isFinite(endsAt)
          ? now >= startsAt && now <= endsAt
          : false;
      const inCampaign = context.activeCampaignIds.includes(rule.campaignId);

      return inCampaign && inWindow
        ? success('Limited campaign active')
        : failure('Limited-time campaign required');
    }
    case 'one_time_purchase':
      return context.purchasedThemeIds.includes(rule.productId)
        ? success('One-time purchase unlocked')
        : failure('Theme pack purchase required');
    case 'any_of': {
      const matched = rule.rules
        .map((childRule) => evaluateThemeUnlock(childRule, context))
        .find((result) => result.unlocked);

      return matched ?? failure('Unavailable with current unlocks');
    }
    case 'all_of': {
      const results = rule.rules.map((childRule) => evaluateThemeUnlock(childRule, context));
      const failed = results.find((result) => !result.unlocked);

      return failed ?? success('All unlock requirements met');
    }
    default: {
      const exhaustiveCheck: never = rule;
      return exhaustiveCheck;
    }
  }
}
