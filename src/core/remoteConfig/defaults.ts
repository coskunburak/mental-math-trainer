import { getDefaultNeuroFusionConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import { DEFAULT_NEURO_PASS_CONFIG } from '@features/neuroPass/domain/config/NeuroPassConfig';

import { remoteConfigKeys } from './keys';

const neuro = getDefaultNeuroFusionConfig();

export const remoteConfigDefaults: Record<string, string | number | boolean> = {
  [remoteConfigKeys.neuroFusionBpmMin]: neuro.minBpm,
  [remoteConfigKeys.neuroFusionBpmMax]: neuro.maxBpm,
  [remoteConfigKeys.neuroFusionBeatWindows]: JSON.stringify(neuro.beatWindowsByTier),
  [remoteConfigKeys.neuroFusionBeatsPerQuestion]: JSON.stringify(neuro.beatsPerQuestionByTier),
  [remoteConfigKeys.neuroFusionPhaseDurations]: JSON.stringify(neuro.phaseLengths),
  [remoteConfigKeys.neuroFusionScoringWeights]: JSON.stringify(neuro.scoring),
  [remoteConfigKeys.neuroFusionFlowTuning]: JSON.stringify(neuro.flow),
  [remoteConfigKeys.neuroFusionPunishment]: JSON.stringify(neuro.antiSpam),
  [remoteConfigKeys.neuroFusionPuzzleMix]: JSON.stringify(neuro.puzzleMix),
  [remoteConfigKeys.neuroFusionMemoryRange]: JSON.stringify(neuro.memoryStepsByTier),
  [remoteConfigKeys.neuroFusionReactionWindow]: JSON.stringify(neuro.reactionWindowMsByTier),
  [remoteConfigKeys.neuroPassManifestEnabled]: false,
  [remoteConfigKeys.neuroPassManifestJson]: '',
  [remoteConfigKeys.neuroPassSoftCapThreshold]: DEFAULT_NEURO_PASS_CONFIG.softCapThreshold,
  [remoteConfigKeys.neuroPassHardCapThreshold]: DEFAULT_NEURO_PASS_CONFIG.hardCapThreshold,
  [remoteConfigKeys.neuroPassSoftCapMultiplier]: DEFAULT_NEURO_PASS_CONFIG.softCapMultiplier,
  [remoteConfigKeys.neuroPassRhythmBonusWeight]: DEFAULT_NEURO_PASS_CONFIG.rhythmBonusWeight,
  [remoteConfigKeys.neuroPassComboBonusWeight]: DEFAULT_NEURO_PASS_CONFIG.comboBonusWeight,
  [remoteConfigKeys.neuroPassAntiSpamScale]: DEFAULT_NEURO_PASS_CONFIG.antiSpamScale,
  [remoteConfigKeys.neuroPassManifestOverrideVersion]:
    DEFAULT_NEURO_PASS_CONFIG.manifestOverrideVersion,
  [remoteConfigKeys.neuroPassManifestOverrideKey]:
    DEFAULT_NEURO_PASS_CONFIG.manifestOverrideKey,
};
