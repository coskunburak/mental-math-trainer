import type {
  NeuroFusionConfig,
  NeuroFusionPhase,
  NeuroFusionPhaseType,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

const ROTATION: NeuroFusionPhaseType[] = ['rhythm_math', 'puzzle', 'cognitive_blend'];

export class NeuroFusionPhaseScheduler {
  build(totalBeats: number, config: NeuroFusionConfig): NeuroFusionPhase[] {
    const bossBeats = Math.min(config.phaseLengths.boss, totalBeats);
    const regularBeats = Math.max(0, totalBeats - bossBeats);

    const phases: NeuroFusionPhase[] = [];
    let index = 0;
    let cursor = 0;
    let rotationIndex = 0;

    while (cursor < regularBeats) {
      const type = ROTATION[rotationIndex % ROTATION.length];
      const plannedLength = phaseLengthByType(type, config);
      const durationBeats = Math.min(plannedLength, regularBeats - cursor);

      phases.push({
        index,
        type,
        startBeat: cursor,
        endBeatExclusive: cursor + durationBeats,
        durationBeats,
      });

      cursor += durationBeats;
      index += 1;
      rotationIndex += 1;
    }

    phases.push({
      index,
      type: 'boss',
      startBeat: regularBeats,
      endBeatExclusive: regularBeats + bossBeats,
      durationBeats: bossBeats,
    });

    return phases;
  }
}

function phaseLengthByType(type: NeuroFusionPhaseType, config: NeuroFusionConfig): number {
  switch (type) {
    case 'rhythm_math':
      return config.phaseLengths.rhythmMath;
    case 'puzzle':
      return config.phaseLengths.puzzle;
    case 'cognitive_blend':
      return config.phaseLengths.cognitiveBlend;
    case 'boss':
      return config.phaseLengths.boss;
    default:
      return config.phaseLengths.rhythmMath;
  }
}
