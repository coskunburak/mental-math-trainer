import type { NeuroPassXpGrantMeta } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';

export interface XpGrantRequest {
  idempotencyKey: string;
  amount: number;
  source: NeuroPassXpSource;
  meta?: NeuroPassXpGrantMeta;
  createdAtUtc: string;
}
