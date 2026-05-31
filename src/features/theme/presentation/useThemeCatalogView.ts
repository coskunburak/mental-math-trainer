import { useMemo } from 'react';

import { useAppTheme } from '@app/theme';

export function useThemeCatalogView() {
  const { themes, unlockedThemes, selectedTheme, selectTheme, getThemeAccess } = useAppTheme();

  const unlockedThemeIds = useMemo(() => unlockedThemes.map((theme) => theme.id), [unlockedThemes]);

  const lockedThemeCount = themes.length - unlockedThemeIds.length;

  const lockedThemes = useMemo(
    () => themes.filter((theme) => !getThemeAccess(theme.id).unlocked),
    [getThemeAccess, themes],
  );

  const nextLockedPremiumThemeName = useMemo(() => {
    if (lockedThemes.length === 0) {
      return null;
    }

    const nextTheme = lockedThemes[0];
    return nextTheme.name;
  }, [lockedThemes]);

  const cycleTheme = (step: number) => {
    if (unlockedThemeIds.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, unlockedThemeIds.indexOf(selectedTheme.id));
    const nextIndex = (currentIndex + step + unlockedThemeIds.length) % unlockedThemeIds.length;
    selectTheme(unlockedThemeIds[nextIndex]);
  };

  return {
    selectedTheme,
    lockedThemeCount,
    nextLockedPremiumThemeName,
    cycleTheme,
  };
}
