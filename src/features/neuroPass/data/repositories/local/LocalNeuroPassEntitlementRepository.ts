import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassEntitlementRepository } from '@features/neuroPass/domain/repositories/NeuroPassEntitlementRepository';

export class LocalNeuroPassEntitlementRepository implements NeuroPassEntitlementRepository {
  constructor(private readonly localStore: NeuroPassLocalStore) {}

  async getEntitlement(seasonId: string): Promise<NeuroPassEntitlement> {
    return this.localStore.getEntitlement(seasonId);
  }

  async setEntitlement(seasonId: string, entitlement: NeuroPassEntitlement): Promise<void> {
    await this.localStore.setEntitlement(seasonId, entitlement);
  }
}
