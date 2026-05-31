import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import { createKeyValueStore } from '@core/storage/mmkvStore';
import {
  DEFAULT_THEME_ACCESS_CONTEXT,
  DEFAULT_THEME_ID,
  THEME_CATALOG,
  ThemePreferenceStore,
  defaultThemePreference,
  evaluateThemeUnlock,
  getThemeById,
  listThemesWithAccess,
  resolveThemeSelection,
  type GameThemeDefinition,
  type ThemeAccessContext,
  type ThemeAccessResult,
  type ThemeCategory,
  type ThemeModePreference,
} from '@features/theme';

import type { ThemeColors } from './colors';
import { createMotion } from './motion';
import { radius } from './radius';
import { createShadows } from './shadows';
import { spacing } from './spacing';
import { createThemeColors, type ThemeMode } from './themeColorTokens';
import { createTypography, type TypographyTokens } from './typography';

export type { ThemeMode };

export interface AppTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  mode: ThemeMode;
  isDark: boolean;
  backgroundGradient: readonly [string, string, string];
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  motion: ReturnType<typeof createMotion>;
  typography: TypographyTokens;
  shadows: ReturnType<typeof createShadows>;
  hudStyle: GameThemeDefinition['hudStyle'];
  animationStyle: GameThemeDefinition['animationStyle'];
  typographyStyle: GameThemeDefinition['typographyStyle'];
  soundPack: GameThemeDefinition['soundPack'];
  particleEffectType: GameThemeDefinition['particleEffectType'];
}

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  modePreference: ThemeModePreference;
  setMode: (mode: ThemeMode) => void;
  setModePreference: (mode: ThemeModePreference) => void;
  toggleMode: () => void;
  selectedTheme: GameThemeDefinition;
  selectedThemeId: string;
  themes: readonly GameThemeDefinition[];
  unlockedThemes: readonly GameThemeDefinition[];
  selectTheme: (themeId: string) => void;
  getThemeAccess: (themeId: string) => ThemeAccessResult;
  unlockContext: ThemeAccessContext;
  setUnlockContext: (next: Partial<ThemeAccessContext>) => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const themeCache = new Map<string, AppTheme>();

function buildTheme(themeDefinition: GameThemeDefinition, mode: ThemeMode): AppTheme {
  const colors = createThemeColors(themeDefinition, mode);

  return {
    id: themeDefinition.id,
    name: themeDefinition.name,
    category: themeDefinition.category,
    mode,
    isDark: mode === 'dark',
    backgroundGradient: themeDefinition.backgroundGradient,
    colors,
    spacing,
    radius,
    motion: createMotion(themeDefinition.animationStyle),
    typography: createTypography(themeDefinition.typographyStyle),
    shadows: createShadows(mode, colors.shadow, themeDefinition.hudStyle),
    hudStyle: themeDefinition.hudStyle,
    animationStyle: themeDefinition.animationStyle,
    typographyStyle: themeDefinition.typographyStyle,
    soundPack: themeDefinition.soundPack,
    particleEffectType: themeDefinition.particleEffectType,
  };
}

function getCachedTheme(themeDefinition: GameThemeDefinition, mode: ThemeMode): AppTheme {
  const key = `${themeDefinition.id}:${mode}`;
  const cached = themeCache.get(key);
  if (cached) {
    return cached;
  }

  const nextTheme = buildTheme(themeDefinition, mode);
  themeCache.set(key, nextTheme);
  return nextTheme;
}

const defaultThemeDefinition = getThemeById(DEFAULT_THEME_ID) ?? THEME_CATALOG[0];

export const lightTheme = getCachedTheme(defaultThemeDefinition, 'light');
export const darkTheme = getCachedTheme(defaultThemeDefinition, 'dark');

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemMode: ThemeMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const preferenceStore = useMemo(() => new ThemePreferenceStore(createKeyValueStore()), []);

  const [modePreference, setModePreferenceState] = useState<ThemeModePreference>(
    defaultThemePreference.modePreference,
  );
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    defaultThemePreference.selectedThemeId,
  );
  const [unlockContext, setUnlockContextState] = useState<ThemeAccessContext>(
    DEFAULT_THEME_ACCESS_CONTEXT,
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    preferenceStore
      .load()
      .then((preference) => {
        if (!active) {
          return;
        }

        setModePreferenceState(preference.modePreference);
        setSelectedThemeId(preference.selectedThemeId);
        setIsHydrated(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setIsHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [preferenceStore]);

  const mode: ThemeMode = modePreference === 'system' ? systemMode : modePreference;

  const selectedTheme = useMemo(() => {
    return resolveThemeSelection(selectedThemeId, unlockContext);
  }, [selectedThemeId, unlockContext]);

  useEffect(() => {
    if (selectedTheme.id !== selectedThemeId) {
      setSelectedThemeId(selectedTheme.id);
    }
  }, [selectedTheme.id, selectedThemeId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void preferenceStore.save({
      selectedThemeId,
      modePreference,
    });
  }, [isHydrated, modePreference, preferenceStore, selectedThemeId]);

  const themesWithAccess = useMemo(() => listThemesWithAccess(unlockContext), [unlockContext]);

  const unlockedThemes = useMemo(
    () => themesWithAccess.filter((entry) => entry.access.unlocked).map((entry) => entry.theme),
    [themesWithAccess],
  );

  const accessMap = useMemo(() => {
    return new Map<string, ThemeAccessResult>(
      themesWithAccess.map((entry) => [entry.theme.id, entry.access]),
    );
  }, [themesWithAccess]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModePreferenceState(nextMode);
  }, []);

  const setModePreference = useCallback((nextMode: ThemeModePreference) => {
    setModePreferenceState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModePreferenceState((previous) => {
      const resolvedMode = previous === 'system' ? systemMode : previous;
      return resolvedMode === 'light' ? 'dark' : 'light';
    });
  }, [systemMode]);

  const selectTheme = useCallback(
    (themeId: string) => {
      const theme = getThemeById(themeId);
      if (!theme) {
        return;
      }

      const access = evaluateThemeUnlock(theme.unlockRule, unlockContext);
      if (!access.unlocked) {
        return;
      }

      setSelectedThemeId((previous) => (previous === themeId ? previous : themeId));
    },
    [unlockContext],
  );

  const getThemeAccess = useCallback(
    (themeId: string): ThemeAccessResult => {
      const fromMap = accessMap.get(themeId);
      if (fromMap) {
        return fromMap;
      }

      const theme = getThemeById(themeId);
      if (!theme) {
        return {
          unlocked: false,
          reason: 'Unknown theme',
        };
      }

      return evaluateThemeUnlock(theme.unlockRule, unlockContext);
    },
    [accessMap, unlockContext],
  );

  const setUnlockContext = useCallback((next: Partial<ThemeAccessContext>) => {
    setUnlockContextState((previous) => ({
      tier: next.tier ?? previous.tier,
      streakDays:
        typeof next.streakDays === 'number'
          ? Math.max(0, Math.floor(next.streakDays))
          : previous.streakDays,
      referralCount:
        typeof next.referralCount === 'number'
          ? Math.max(0, Math.floor(next.referralCount))
          : previous.referralCount,
      purchasedThemeIds: next.purchasedThemeIds
        ? [...new Set(next.purchasedThemeIds)]
        : previous.purchasedThemeIds,
      activeSeasonIds: next.activeSeasonIds
        ? [...new Set(next.activeSeasonIds)]
        : previous.activeSeasonIds,
      activeCampaignIds: next.activeCampaignIds
        ? [...new Set(next.activeCampaignIds)]
        : previous.activeCampaignIds,
      collabPassIds: next.collabPassIds ? [...new Set(next.collabPassIds)] : previous.collabPassIds,
      now: typeof next.now === 'number' ? next.now : previous.now,
    }));
  }, []);

  const theme = useMemo(() => getCachedTheme(selectedTheme, mode), [mode, selectedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      modePreference,
      setMode,
      setModePreference,
      toggleMode,
      selectedTheme,
      selectedThemeId: selectedTheme.id,
      themes: THEME_CATALOG,
      unlockedThemes,
      selectTheme,
      getThemeAccess,
      unlockContext,
      setUnlockContext,
      isHydrated,
    }),
    [
      getThemeAccess,
      isHydrated,
      mode,
      modePreference,
      selectTheme,
      selectedTheme,
      setMode,
      setModePreference,
      setUnlockContext,
      theme,
      toggleMode,
      unlockContext,
      unlockedThemes,
    ],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }

  return value;
}
