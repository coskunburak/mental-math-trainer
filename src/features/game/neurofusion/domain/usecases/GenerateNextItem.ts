import type { NeuroFusionChallengeItem } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

export class GenerateNextItem {
  constructor(private readonly engine: NeuroFusionRunEngine) {}

  execute(timestampMs: number): NeuroFusionChallengeItem | null {
    return this.engine.generateNextItem(timestampMs);
  }
}
