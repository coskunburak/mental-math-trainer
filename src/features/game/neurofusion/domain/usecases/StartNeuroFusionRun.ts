import type {
  NeuroFusionConfig,
  NeuroFusionModeVariant,
  NeuroFusionPreset,
  NeuroFusionRunState,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

export interface StartNeuroFusionRunInput {
  seed: number;
  startedAtMs: number;
  modeVariant?: NeuroFusionModeVariant;
  preset?: NeuroFusionPreset;
  trackId?: string;
  configOverrides?: Partial<NeuroFusionConfig>;
  calibrationOffsetMs?: number;
  calibrationStdDevMs?: number;
}

export class StartNeuroFusionRun {
  constructor(private readonly engine: NeuroFusionRunEngine) {}

  execute(input: StartNeuroFusionRunInput): NeuroFusionRunState {
    return this.engine.startRun(input);
  }
}
