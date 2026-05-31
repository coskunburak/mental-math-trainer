export {
  ThemePreferenceStore,
  defaultThemePreference,
  type ThemePreference,
  type ThemeModePreference,
} from './data/ThemePreferenceStore';
export { DEFAULT_THEME_ID, THEME_CATALOG, getThemeById } from './domain/services/themeCatalog';
export { evaluateThemeUnlock } from './domain/services/themeUnlockEvaluator';
export {
  listThemesWithAccess,
  listUnlockedThemes,
  resolveThemeSelection,
  type ThemeAccessEntry,
} from './domain/services/themeCatalogService';
export {
  type AnimationStyle,
  type GameThemeDefinition,
  type HudStyle,
  type ParticleEffectType,
  type SoundPack,
  type ThemeAccessContext,
  type ThemeAccessResult,
  type ThemeCategory,
  type ThemeUnlockRule,
  type TypographyStyle,
  DEFAULT_THEME_ACCESS_CONTEXT,
} from './domain/entities/GameTheme';
