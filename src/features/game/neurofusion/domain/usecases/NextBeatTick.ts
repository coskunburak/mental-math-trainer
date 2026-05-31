import type { NeuroFusionRunState } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

export class NextBeatTick {
  constructor(private readonly engine: NeuroFusionRunEngine) {}

  execute(timestampMs: number): NeuroFusionRunState {
    return this.engine.nextBeatTick(timestampMs);
  }
}
