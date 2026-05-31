import type { NeuroPassPersistedProgressModel } from '@features/neuroPass/data/models/NeuroPassManifestModel';
import type { NeuroPassTimeHeuristicState } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export interface NeuroPassProgressRepository {
  readProgress(): Promise<NeuroPassPersistedProgressModel>;
  writeProgress(progress: NeuroPassPersistedProgressModel): Promise<void>;
  readLastSeenSeasonId(): Promise<string | null>;
  writeLastSeenSeasonId(seasonId: string): Promise<void>;
  readLastAppliedSeasonState(): Promise<NeuroPassSeasonState | null>;
  writeLastAppliedSeasonState(state: NeuroPassSeasonState): Promise<void>;
  readTimeHeuristicState(): Promise<NeuroPassTimeHeuristicState>;
  writeTimeHeuristicState(state: NeuroPassTimeHeuristicState): Promise<void>;
}
