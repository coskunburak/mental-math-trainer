import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';

export interface NeuroPassEntitlementRepository {
  getEntitlement(seasonId: string): Promise<NeuroPassEntitlement>;
  setEntitlement(seasonId: string, entitlement: NeuroPassEntitlement): Promise<void>;
}
