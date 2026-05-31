import type { KeyValueStore } from '@core/storage/KeyValueStore';

export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly map = new Map<string, string>();

  async getString(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
}
