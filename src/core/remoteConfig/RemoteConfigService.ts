import type { RemoteConfigClient } from './RemoteConfigClient';
import { remoteConfigDefaults } from './defaults';

export class RemoteConfigService {
  constructor(private readonly client: RemoteConfigClient) {}

  getString(key: string): string {
    const value = this.client.getString(key);
    if (value != null) {
      return value;
    }

    const fallback = remoteConfigDefaults[key];
    return typeof fallback === 'string' ? fallback : String(fallback ?? '');
  }

  getNumber(key: string): number {
    const value = this.client.getNumber(key);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const fallback = remoteConfigDefaults[key];
    return typeof fallback === 'number' ? fallback : Number(fallback ?? 0);
  }

  getBoolean(key: string): boolean {
    const value = this.client.getBoolean(key);
    if (typeof value === 'boolean') {
      return value;
    }

    const fallback = remoteConfigDefaults[key];
    return typeof fallback === 'boolean' ? fallback : fallback === 'true';
  }
}
