import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassPersistedProgressModel } from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassTimeHeuristicState } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type { NeuroPassProgressRepository } from '@features/neuroPass/domain/repositories/NeuroPassProgressRepository';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export class LocalNeuroPassProgressRepository implements NeuroPassProgressRepository {
  constructor(private readonly localStore: NeuroPassLocalStore) {}

  async readProgress(): Promise<NeuroPassPersistedProgressModel> {
    return this.localStore.readProgress();
  }

  async writeProgress(progress: NeuroPassPersistedProgressModel): Promise<void> {
    await this.localStore.writeProgress(progress);
  }

  async readLastSeenSeasonId(): Promise<string | null> {
    return this.localStore.readLastSeenSeasonId();
  }

  async writeLastSeenSeasonId(seasonId: string): Promise<void> {
    await this.localStore.writeLastSeenSeasonId(seasonId);
  }

  async readLastAppliedSeasonState(): Promise<NeuroPassSeasonState | null> {
    return this.localStore.readLastAppliedSeasonState();
  }

  async writeLastAppliedSeasonState(state: NeuroPassSeasonState): Promise<void> {
    await this.localStore.writeLastAppliedSeasonState(state);
  }

  async readTimeHeuristicState(): Promise<NeuroPassTimeHeuristicState> {
    return this.localStore.readTimeHeuristicState();
  }

  async writeTimeHeuristicState(state: NeuroPassTimeHeuristicState): Promise<void> {
    await this.localStore.writeTimeHeuristicState(state);
  }
}
