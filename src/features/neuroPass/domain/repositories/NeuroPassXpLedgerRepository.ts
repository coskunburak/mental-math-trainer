import type { NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';

export interface NeuroPassXpLedgerRepository {
  hasGrant(id: string, source: NeuroPassXpSource): Promise<boolean>;
  hasSeenRunId(runId: string): Promise<boolean>;
  rebuildSeenRunIdsIndex(force?: boolean): Promise<number>;
  getTodayRunTotal(nowUtc: Date): Promise<number>;
  getTodayTotalNxp(nowUtc: Date): Promise<number>;
  append(grant: NeuroPassXpGrant): Promise<void>;
  listTodayGrants(nowUtc: Date): Promise<NeuroPassXpGrant[]>;
  listAll(): Promise<NeuroPassXpGrant[]>;
}
