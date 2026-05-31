import { DEFAULT_THEME_ID, THEME_CATALOG, getThemeById } from '../themeCatalog';

describe('themeCatalog', () => {
  it('contains the expected 20 marketing-ready themes', () => {
    expect(THEME_CATALOG).toHaveLength(20);

    const names = THEME_CATALOG.map((theme) => theme.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Cyber Neon',
        'Ice Glass',
        'Cosmic Dark',
        'Vaporwave',
        'Golden Elite',
        'Lightning Pro',
        'Brain Matrix',
        'Stock Market',
        'Focus Mode',
        'Minimal Zen',
        'Retro Arcade',
        'Sunset Gradient',
        'Ocean Deep',
        'Black Gold',
        'Diamond Pro',
        'Space Launch',
        'Dark Crimson',
        'Lab Mode',
        'Color Blast',
        'Festival Limited',
      ]),
    );
  });

  it('keeps monetization split at 3 free and 12 premium-exclusive themes', () => {
    const freeThemes = THEME_CATALOG.filter((theme) => theme.category === 'free');
    const premiumExclusive = THEME_CATALOG.filter((theme) => theme.unlockRule.type === 'premium');

    expect(freeThemes).toHaveLength(3);
    expect(premiumExclusive).toHaveLength(12);
  });

  it('resolves default fallback theme safely', () => {
    const fallback = getThemeById(DEFAULT_THEME_ID);

    expect(fallback).toBeDefined();
    expect(fallback?.category).toBe('free');
  });
});
