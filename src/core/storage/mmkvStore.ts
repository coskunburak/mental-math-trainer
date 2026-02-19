import type { KeyValueStore } from './KeyValueStore';
import { Platform, Settings } from 'react-native';

const memoryStore = new Map<string, string>();

class MemoryKeyValueStore implements KeyValueStore {
  async getString(key: string): Promise<string | null> {
    return memoryStore.get(key) ?? null;
  }

  async setString(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
  }

  async remove(key: string): Promise<void> {
    memoryStore.delete(key);
  }
}

class BrowserLocalStorageStore implements KeyValueStore {
  async getString(key: string): Promise<string | null> {
    return globalThis.localStorage.getItem(key);
  }

  async setString(key: string, value: string): Promise<void> {
    globalThis.localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    globalThis.localStorage.removeItem(key);
  }
}

class IOSSettingsStore implements KeyValueStore {
  async getString(key: string): Promise<string | null> {
    const value = Settings.get(key);
    return typeof value === 'string' ? value : null;
  }

  async setString(key: string, value: string): Promise<void> {
    Settings.set({
      [key]: value,
    });
  }

  async remove(key: string): Promise<void> {
    Settings.set({
      [key]: null,
    });
  }
}

export function createKeyValueStore(): KeyValueStore {
  if (
    Platform.OS === 'ios' &&
    Settings &&
    typeof Settings.get === 'function' &&
    typeof Settings.set === 'function'
  ) {
    return new IOSSettingsStore();
  }

  if ('localStorage' in globalThis && globalThis.localStorage) {
    return new BrowserLocalStorageStore();
  }

  return new MemoryKeyValueStore();
}
