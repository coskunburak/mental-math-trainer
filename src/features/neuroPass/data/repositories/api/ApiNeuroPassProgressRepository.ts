import type { NeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import type { NeuroPassPersistedProgressModel } from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassTimeHeuristicState } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type { NeuroPassProgressRepository } from '@features/neuroPass/domain/repositories/NeuroPassProgressRepository';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export class ApiNeuroPassProgressRepository implements NeuroPassProgressRepository {
  constructor(private readonly apiClient: NeuroPassApiClient) {
    void this.apiClient;
  }

  async readProgress(): Promise<NeuroPassPersistedProgressModel> {
    throw notImplemented('ApiNeuroPassProgressRepository.readProgress');
  }

  async writeProgress(_progress: NeuroPassPersistedProgressModel): Promise<void> {
    throw notImplemented('ApiNeuroPassProgressRepository.writeProgress');
  }

  async readLastSeenSeasonId(): Promise<string | null> {
    throw notImplemented('ApiNeuroPassProgressRepository.readLastSeenSeasonId');
  }

  async writeLastSeenSeasonId(_seasonId: string): Promise<void> {
    throw notImplemented('ApiNeuroPassProgressRepository.writeLastSeenSeasonId');
  }

  async readLastAppliedSeasonState(): Promise<NeuroPassSeasonState | null> {
    throw notImplemented('ApiNeuroPassProgressRepository.readLastAppliedSeasonState');
  }

  async writeLastAppliedSeasonState(_state: NeuroPassSeasonState): Promise<void> {
    throw notImplemented('ApiNeuroPassProgressRepository.writeLastAppliedSeasonState');
  }

  async readTimeHeuristicState(): Promise<NeuroPassTimeHeuristicState> {
    throw notImplemented('ApiNeuroPassProgressRepository.readTimeHeuristicState');
  }

  async writeTimeHeuristicState(_state: NeuroPassTimeHeuristicState): Promise<void> {
    throw notImplemented('ApiNeuroPassProgressRepository.writeTimeHeuristicState');
  }
}

function notImplemented(method: string): Error {
  return new Error(`NotImplemented: ${method}`);
}
