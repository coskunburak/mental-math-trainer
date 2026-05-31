import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassClaimsRepository } from '@features/neuroPass/domain/repositories/NeuroPassClaimsRepository';

export class LocalNeuroPassClaimsRepository implements NeuroPassClaimsRepository {
  constructor(private readonly localStore: NeuroPassLocalStore) {}

  async getClaimedRewardKeys(): Promise<string[]> {
    return this.localStore.getClaimedRewardKeys();
  }

  async setClaimedRewardKeys(keys: string[]): Promise<void> {
    await this.localStore.setClaimedRewardKeys(keys);
  }

  async hasClaimKey(key: string): Promise<boolean> {
    const normalized = key.trim();
    if (normalized.length === 0) {
      return false;
    }

    const keys = await this.localStore.getClaimedRewardKeys();
    return keys.includes(normalized);
  }

  async addClaimKey(key: string): Promise<void> {
    const normalized = key.trim();
    if (normalized.length === 0) {
      return;
    }

    const keys = await this.localStore.getClaimedRewardKeys();
    if (keys.includes(normalized)) {
      return;
    }

    await this.localStore.setClaimedRewardKeys([...keys, normalized].slice(-1000));
  }
}
