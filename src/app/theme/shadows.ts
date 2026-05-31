import type { HudStyle } from '@features/theme/domain/entities/GameTheme';

type ThemeMode = 'light' | 'dark';

export function createShadows(mode: ThemeMode, shadowColor: string, hudStyle: HudStyle) {
  const isDark = mode === 'dark';
  const neonBoost = hudStyle === 'neon' ? 1.2 : 1;
  const glassSoftness = hudStyle === 'glass' ? 1.18 : 1;

  return {
    card: {
      shadowColor,
      shadowOpacity: (isDark ? 0.38 : 0.16) * glassSoftness,
      shadowRadius: (isDark ? 20 : 14) * neonBoost,
      shadowOffset: {
        width: 0,
        height: isDark ? 10 : 8,
      },
      elevation: isDark ? 6 : 4,
    },
    button: {
      shadowColor,
      shadowOpacity: (isDark ? 0.3 : 0.2) * neonBoost,
      shadowRadius: (12 + (hudStyle === 'neon' ? 4 : 0)) * neonBoost,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      elevation: 3,
    },
  } as const;
}
