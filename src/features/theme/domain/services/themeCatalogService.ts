import type {
  GameThemeDefinition,
  ThemeAccessContext,
  ThemeAccessResult,
} from '@features/theme/domain/entities/GameTheme';
import {
  DEFAULT_THEME_ID,
  getThemeById,
  THEME_CATALOG,
} from '@features/theme/domain/services/themeCatalog';
import { evaluateThemeUnlock } from '@features/theme/domain/services/themeUnlockEvaluator';

export interface ThemeAccessEntry {
  theme: GameThemeDefinition;
  access: ThemeAccessResult;
}

export function listThemesWithAccess(context: ThemeAccessContext): ThemeAccessEntry[] {
  return THEME_CATALOG.map((theme) => ({
    theme,
    access: evaluateThemeUnlock(theme.unlockRule, context),
  }));
}

export function listUnlockedThemes(context: ThemeAccessContext): GameThemeDefinition[] {
  return listThemesWithAccess(context)
    .filter((entry) => entry.access.unlocked)
    .map((entry) => entry.theme);
}

export function resolveThemeSelection(
  requestedThemeId: string,
  context: ThemeAccessContext,
): GameThemeDefinition {
  const requestedTheme = getThemeById(requestedThemeId);

  if (requestedTheme) {
    const requestedAccess = evaluateThemeUnlock(requestedTheme.unlockRule, context);
    if (requestedAccess.unlocked) {
      return requestedTheme;
    }
  }

  const unlockedThemes = listUnlockedThemes(context);
  if (unlockedThemes.length > 0) {
    return unlockedThemes[0];
  }

  return getThemeById(DEFAULT_THEME_ID) ?? THEME_CATALOG[0];
}
