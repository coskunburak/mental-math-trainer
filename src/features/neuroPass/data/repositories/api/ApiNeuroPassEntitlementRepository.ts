import type { NeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassEntitlementRepository } from '@features/neuroPass/domain/repositories/NeuroPassEntitlementRepository';

export class ApiNeuroPassEntitlementRepository implements NeuroPassEntitlementRepository {
  constructor(private readonly apiClient: NeuroPassApiClient) {
    void this.apiClient;
  }

  async getEntitlement(_seasonId: string): Promise<NeuroPassEntitlement> {
    throw notImplemented('ApiNeuroPassEntitlementRepository.getEntitlement');
  }

  async setEntitlement(_seasonId: string, _entitlement: NeuroPassEntitlement): Promise<void> {
    throw notImplemented('ApiNeuroPassEntitlementRepository.setEntitlement');
  }
}

function notImplemented(method: string): Error {
  return new Error(`NotImplemented: ${method}`);
}
