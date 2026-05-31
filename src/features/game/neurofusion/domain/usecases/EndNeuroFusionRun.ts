import type { NeuroFusionRunState } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

export class EndNeuroFusionRun {
  constructor(private readonly engine: NeuroFusionRunEngine) {}

  execute(endedAtMs: number): NeuroFusionRunState {
    return this.engine.endRun({ endedAtMs });
  }
}
