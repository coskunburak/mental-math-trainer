import type { NeuroPassClaimTrack } from '@features/neuroPass/domain/idempotency/keys';

export interface ClaimRequest {
  idempotencyKey: string;
  seasonId: string;
  tier: number;
  track: NeuroPassClaimTrack;
}
