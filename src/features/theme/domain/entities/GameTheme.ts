import type { SubscriptionTier } from '@features/game/domain/entities/Monetization';

export type ThemeCategory = 'free' | 'premium' | 'seasonal' | 'limited' | 'collab';

export type HudStyle = 'minimal' | 'neon' | 'glass' | 'retro';

export type AnimationStyle = 'subtle' | 'energetic' | 'glow' | 'cyber';

export type TypographyStyle = 'focus' | 'tech' | 'zen' | 'retro' | 'elite' | 'matrix' | 'market';

export type SoundPack =
  | 'focus_clicks'
  | 'neon_pulses'
  | 'glass_chimes'
  | 'retro_bleeps'
  | 'elite_orchestra'
  | 'matrix_ticks'
  | 'market_ticker';

export type ParticleEffectType =
  | 'none'
  | 'stars'
  | 'sparkles'
  | 'confetti'
  | 'grid'
  | 'candles'
  | 'electric';

export interface ThemePaletteConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundGradient: readonly [string, string, string];
  accentColor: string;
  successColor: string;
  errorColor: string;
  surfaceColor: string;
}

export type ThemeUnlockRule =
  | {
      type: 'free';
    }
  | {
      type: 'premium';
    }
  | {
      type: 'streak';
      minDays: number;
    }
  | {
      type: 'referral';
      minReferrals: number;
    }
  | {
      type: 'seasonal';
      seasonId: string;
    }
  | {
      type: 'limited_time';
      campaignId: string;
      startsAtUtc: string;
      endsAtUtc: string;
    }
  | {
      type: 'one_time_purchase';
      productId: string;
    }
  | {
      type: 'any_of';
      rules: ThemeUnlockRule[];
    }
  | {
      type: 'all_of';
      rules: ThemeUnlockRule[];
    };

export interface ThemeMarketingConfig {
  emotionalFeel: string;
  targetPersona: string;
  tagline: string;
  appStoreConcept: string;
  instagramStoryIdea: string;
  beforeAfterConcept: string;
  sampleAdCopy: string;
}

export interface GameThemeDefinition extends ThemePaletteConfig {
  id: string;
  name: string;
  category: ThemeCategory;
  hudStyle: HudStyle;
  animationStyle: AnimationStyle;
  typographyStyle: TypographyStyle;
  soundPack: SoundPack;
  particleEffectType: ParticleEffectType;
  unlockRule: ThemeUnlockRule;
  marketing: ThemeMarketingConfig;
}

export interface ThemeAccessContext {
  tier: SubscriptionTier;
  streakDays: number;
  referralCount: number;
  purchasedThemeIds: string[];
  activeSeasonIds: string[];
  activeCampaignIds: string[];
  collabPassIds: string[];
  now?: number;
}

export interface ThemeAccessResult {
  unlocked: boolean;
  reason: string;
}

export const DEFAULT_THEME_ACCESS_CONTEXT: ThemeAccessContext = {
  tier: 'free',
  streakDays: 0,
  referralCount: 0,
  purchasedThemeIds: [],
  activeSeasonIds: [],
  activeCampaignIds: [],
  collabPassIds: [],
};
