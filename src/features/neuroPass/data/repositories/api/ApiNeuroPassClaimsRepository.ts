import type { NeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import type { NeuroPassClaimsRepository } from '@features/neuroPass/domain/repositories/NeuroPassClaimsRepository';

export class ApiNeuroPassClaimsRepository implements NeuroPassClaimsRepository {
  constructor(private readonly apiClient: NeuroPassApiClient) {
    void this.apiClient;
  }

  async getClaimedRewardKeys(): Promise<string[]> {
    throw notImplemented('ApiNeuroPassClaimsRepository.getClaimedRewardKeys');
  }

  async setClaimedRewardKeys(_keys: string[]): Promise<void> {
    throw notImplemented('ApiNeuroPassClaimsRepository.setClaimedRewardKeys');
  }

  async hasClaimKey(_key: string): Promise<boolean> {
    throw notImplemented('ApiNeuroPassClaimsRepository.hasClaimKey');
  }

  async addClaimKey(_key: string): Promise<void> {
    throw notImplemented('ApiNeuroPassClaimsRepository.addClaimKey');
  }
}

function notImplemented(method: string): Error {
  return new Error(`NotImplemented: ${method}`);
}
