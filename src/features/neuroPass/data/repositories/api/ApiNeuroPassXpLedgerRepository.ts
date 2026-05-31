import type { NeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import type { NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import type { NeuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';

export class ApiNeuroPassXpLedgerRepository implements NeuroPassXpLedgerRepository {
  constructor(private readonly apiClient: NeuroPassApiClient) {
    void this.apiClient;
  }

  async hasGrant(_id: string, _source: NeuroPassXpSource): Promise<boolean> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.hasGrant');
  }

  async hasSeenRunId(_runId: string): Promise<boolean> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.hasSeenRunId');
  }

  async rebuildSeenRunIdsIndex(_force?: boolean): Promise<number> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.rebuildSeenRunIdsIndex');
  }

  async getTodayRunTotal(_nowUtc: Date): Promise<number> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.getTodayRunTotal');
  }

  async getTodayTotalNxp(_nowUtc: Date): Promise<number> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.getTodayTotalNxp');
  }

  async append(_grant: NeuroPassXpGrant): Promise<void> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.append');
  }

  async listTodayGrants(_nowUtc: Date): Promise<NeuroPassXpGrant[]> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.listTodayGrants');
  }

  async listAll(): Promise<NeuroPassXpGrant[]> {
    throw notImplemented('ApiNeuroPassXpLedgerRepository.listAll');
  }
}

function notImplemented(method: string): Error {
  return new Error(`NotImplemented: ${method}`);
}
