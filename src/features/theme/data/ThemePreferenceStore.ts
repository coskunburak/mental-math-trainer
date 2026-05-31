import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';
import { DEFAULT_THEME_ID, getThemeById } from '@features/theme/domain/services/themeCatalog';

export type ThemeModePreference = 'light' | 'dark' | 'system';

export interface ThemePreference {
  selectedThemeId: string;
  modePreference: ThemeModePreference;
}

interface PersistedThemePreference {
  schemaVersion: number;
  value: ThemePreference;
}

const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_THEME_PREFERENCE: ThemePreference = {
  selectedThemeId: DEFAULT_THEME_ID,
  modePreference: 'system',
};

export class ThemePreferenceStore {
  constructor(private readonly storage: KeyValueStore) {}

  async load(): Promise<ThemePreference> {
    const raw = await this.storage.getString(storageKeys.themePreference);
    if (!raw) {
      return DEFAULT_THEME_PREFERENCE;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedThemePreference;
      if (!parsed || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return DEFAULT_THEME_PREFERENCE;
      }

      return normalizePreference(parsed.value);
    } catch {
      return DEFAULT_THEME_PREFERENCE;
    }
  }

  async save(value: ThemePreference): Promise<void> {
    const payload: PersistedThemePreference = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      value: normalizePreference(value),
    };

    await this.storage.setString(storageKeys.themePreference, JSON.stringify(payload));
  }
}

function normalizePreference(value: ThemePreference): ThemePreference {
  return {
    selectedThemeId: getThemeById(value.selectedThemeId) ? value.selectedThemeId : DEFAULT_THEME_ID,
    modePreference:
      value.modePreference === 'light' ||
      value.modePreference === 'dark' ||
      value.modePreference === 'system'
        ? value.modePreference
        : 'system',
  };
}

export const defaultThemePreference = DEFAULT_THEME_PREFERENCE;
