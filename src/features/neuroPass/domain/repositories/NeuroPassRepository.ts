import type {
  NeuroPassClaimPlaceholderModel,
  NeuroPassPersistedEntitlementModel,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassClaimsRepository } from '@features/neuroPass/domain/repositories/NeuroPassClaimsRepository';
import type { NeuroPassEntitlementRepository } from '@features/neuroPass/domain/repositories/NeuroPassEntitlementRepository';
import type { NeuroPassProgressRepository } from '@features/neuroPass/domain/repositories/NeuroPassProgressRepository';

export type NeuroPassManifestSource = 'remote_config' | 'asset' | 'cache';
export type ManifestLoadStrategy = 'cached_first' | 'remote_first';

export interface ManifestCandidate {
  source: NeuroPassManifestSource;
  rawJson: string;
}

export interface NeuroPassRepository
  extends NeuroPassProgressRepository, NeuroPassEntitlementRepository, NeuroPassClaimsRepository {
  getManifestCandidates(strategy: ManifestLoadStrategy): Promise<ManifestCandidate[]>;
  saveCachedManifest(rawJson: string): Promise<void>;
  readEntitlement(): Promise<NeuroPassPersistedEntitlementModel>;
  writeEntitlement(entitlement: NeuroPassPersistedEntitlementModel): Promise<void>;
  readEntitlementForSeason(seasonId: string): Promise<NeuroPassPersistedEntitlementModel>;
  writeEntitlementForSeason(seasonId: string, entitlement: NeuroPassPersistedEntitlementModel): Promise<void>;
  readClaimPlaceholder(): Promise<NeuroPassClaimPlaceholderModel>;
  writeClaimPlaceholder(claimState: NeuroPassClaimPlaceholderModel): Promise<void>;
}
