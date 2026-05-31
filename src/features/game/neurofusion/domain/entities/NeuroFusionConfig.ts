import type {
  NeuroFusionConfig,
  NeuroFusionPreset,
  NeuroFusionPuzzleType,
} from './NeuroFusionTypes';

const PUZZLE_TYPES: NeuroFusionPuzzleType[] = [
  'missing_sequence',
  'mixed_operation_pattern',
  'grid_mini',
  'odd_one_out',
  'equation_balance',
  'quick_estimate',
];

const BASE_STANDARD_CONFIG: NeuroFusionConfig = {
  preset: 'standard',
  bpm: 120,
  minBpm: 90,
  maxBpm: 150,
  runDurationSeconds: 180,
  calibrationEnabled: true,
  beatWindowsByTier: {
    1: { perfect: 70, great: 130, good: 220 },
    2: { perfect: 65, great: 125, good: 210 },
    3: { perfect: 60, great: 120, good: 200 },
    4: { perfect: 55, great: 110, good: 190 },
    5: { perfect: 50, great: 100, good: 175 },
  },
  beatsPerQuestionByTier: {
    1: 4,
    2: 3,
    3: 3,
    4: 2,
    5: 2,
  },
  puzzleTimeBeatsByTier: {
    1: 8,
    2: 7,
    3: 6,
    4: 5,
    5: 4,
  },
  hintEnabled: true,
  phaseLengths: {
    rhythmMath: 12,
    puzzle: 12,
    cognitiveBlend: 12,
    boss: 48,
  },
  scoring: {
    rhythmBase: 34,
    puzzleBase: 38,
    memoryBase: 44,
    reactionBase: 28,
    speedBonusMax: 18,
    comboStep: 0.06,
    comboCap: 20,
    insightStep: 0.08,
    bossMultiplier: 1.28,
    perfectBonus: 0.4,
    greatBonus: 0.2,
    goodBonus: 0.05,
    offbeatBonus: 0,
    wrongPenalty: 12,
    offbeatPenalty: 2,
    spamPenalty: 14,
  },
  flow: {
    maxFlow: 100,
    gainPerfect: 10,
    gainGreat: 7,
    gainGood: 4,
    gainCorrect: 2,
    lossWrong: 12,
    lossMiss: 7,
    lossSpam: 10,
  },
  adaptive: {
    lowAccuracyThreshold: 0.65,
    highAccuracyThreshold: 0.86,
    lowBeatRateThreshold: 0.35,
    highBeatRateThreshold: 0.7,
    widenWindowFactor: 1.08,
    tightenWindowFactor: 0.94,
    minWindowScale: 0.78,
    maxWindowScale: 1.35,
    beatsPerQuestionRecoveryStep: 1,
    beatsPerQuestionPressureStep: 1,
    minBeatsPerQuestion: 2,
    maxBeatsPerQuestion: 5,
    reactionWindowRecoveryMs: 60,
    reactionWindowPressureMs: 45,
    minReactionWindowMs: 420,
    maxReactionWindowMs: 900,
    minMemorySteps: 3,
    maxMemorySteps: 6,
  },
  antiSpam: {
    windowMs: 420,
    maxInputsInWindow: 4,
    penaltyCooldownMs: 1500,
  },
  puzzleMix: {
    missing_sequence: 1,
    mixed_operation_pattern: 1,
    grid_mini: 1,
    odd_one_out: 1,
    equation_balance: 1,
    quick_estimate: 1,
  },
  memoryStepsByTier: {
    1: 3,
    2: 4,
    3: 4,
    4: 5,
    5: 6,
  },
  reactionWindowMsByTier: {
    1: 760,
    2: 700,
    3: 640,
    4: 590,
    5: 540,
  },
  bossComposition: {
    rhythmQuestions: 3,
    puzzles: 2,
    reactionGates: 3,
    memoryStacks: 1,
  },
  gradeThresholds: [
    { grade: 'S', minScore: 2550, minAccuracy: 0.9, maxAverageBeatOffsetMs: 90 },
    { grade: 'A', minScore: 2050, minAccuracy: 0.82, maxAverageBeatOffsetMs: 135 },
    { grade: 'B', minScore: 1500, minAccuracy: 0.72, maxAverageBeatOffsetMs: 190 },
    { grade: 'C', minScore: 0, minAccuracy: 0, maxAverageBeatOffsetMs: 9_999 },
  ],
  maxDifficultyTier: 5,
  minDifficultyTier: 1,
};

const PRESET_OVERRIDES: Record<NeuroFusionPreset, Partial<NeuroFusionConfig>> = {
  beginner: {
    preset: 'beginner',
    bpm: 110,
    beatWindowsByTier: {
      1: { perfect: 84, great: 150, good: 260 },
      2: { perfect: 80, great: 142, good: 250 },
      3: { perfect: 76, great: 136, good: 240 },
      4: { perfect: 70, great: 128, good: 226 },
      5: { perfect: 64, great: 122, good: 210 },
    },
    beatsPerQuestionByTier: {
      1: 5,
      2: 4,
      3: 4,
      4: 3,
      5: 3,
    },
    puzzleTimeBeatsByTier: {
      1: 9,
      2: 8,
      3: 7,
      4: 6,
      5: 5,
    },
    hintEnabled: true,
    runDurationSeconds: 150,
    adaptive: {
      ...BASE_STANDARD_CONFIG.adaptive,
      widenWindowFactor: 1.12,
      tightenWindowFactor: 0.97,
      minWindowScale: 0.9,
      maxWindowScale: 1.5,
      maxBeatsPerQuestion: 6,
    },
  },
  standard: {
    preset: 'standard',
  },
  hardcore: {
    preset: 'hardcore',
    bpm: 140,
    beatWindowsByTier: {
      1: { perfect: 58, great: 110, good: 180 },
      2: { perfect: 54, great: 102, good: 168 },
      3: { perfect: 50, great: 95, good: 158 },
      4: { perfect: 46, great: 88, good: 146 },
      5: { perfect: 42, great: 80, good: 132 },
    },
    beatsPerQuestionByTier: {
      1: 3,
      2: 3,
      3: 2,
      4: 2,
      5: 1,
    },
    puzzleTimeBeatsByTier: {
      1: 7,
      2: 6,
      3: 5,
      4: 4,
      5: 3,
    },
    hintEnabled: false,
    runDurationSeconds: 210,
    adaptive: {
      ...BASE_STANDARD_CONFIG.adaptive,
      widenWindowFactor: 1.06,
      tightenWindowFactor: 0.91,
      minWindowScale: 0.7,
      maxWindowScale: 1.2,
      minBeatsPerQuestion: 1,
      maxBeatsPerQuestion: 4,
      minReactionWindowMs: 350,
      maxReactionWindowMs: 700,
      maxMemorySteps: 7,
    },
    flow: {
      ...BASE_STANDARD_CONFIG.flow,
      lossWrong: 14,
      lossMiss: 10,
      gainCorrect: 1,
    },
  },
};

export function createNeuroFusionConfig(
  preset: NeuroFusionPreset,
  overrides: Partial<NeuroFusionConfig> = {},
): NeuroFusionConfig {
  const presetOverrides = PRESET_OVERRIDES[preset] ?? PRESET_OVERRIDES.standard;
  const merged = mergeConfig(BASE_STANDARD_CONFIG, presetOverrides, overrides);

  const bpm = Math.max(merged.minBpm, Math.min(merged.maxBpm, Math.round(merged.bpm)));
  const runDurationSeconds = Math.max(120, Math.min(240, Math.round(merged.runDurationSeconds)));

  return {
    ...merged,
    preset,
    bpm,
    runDurationSeconds,
    puzzleMix: normalizePuzzleMix(merged.puzzleMix),
  };
}

export const NEURO_FUSION_PRESETS: Record<NeuroFusionPreset, NeuroFusionConfig> = {
  beginner: createNeuroFusionConfig('beginner'),
  standard: createNeuroFusionConfig('standard'),
  hardcore: createNeuroFusionConfig('hardcore'),
};

export function getDefaultNeuroFusionConfig(): NeuroFusionConfig {
  return createNeuroFusionConfig('standard');
}

function normalizePuzzleMix(
  puzzleMix: NeuroFusionConfig['puzzleMix'],
): NeuroFusionConfig['puzzleMix'] {
  const next: NeuroFusionConfig['puzzleMix'] = {
    missing_sequence: 1,
    mixed_operation_pattern: 1,
    grid_mini: 1,
    odd_one_out: 1,
    equation_balance: 1,
    quick_estimate: 1,
  };

  for (const type of PUZZLE_TYPES) {
    const weight = puzzleMix[type];
    next[type] = Number.isFinite(weight) ? Math.max(0.1, Number(weight)) : 1;
  }

  return next;
}

function mergeConfig(
  base: NeuroFusionConfig,
  presetOverrides: Partial<NeuroFusionConfig>,
  overrides: Partial<NeuroFusionConfig>,
): NeuroFusionConfig {
  return {
    ...base,
    ...presetOverrides,
    ...overrides,
    beatWindowsByTier: {
      ...base.beatWindowsByTier,
      ...(presetOverrides.beatWindowsByTier ?? {}),
      ...(overrides.beatWindowsByTier ?? {}),
    },
    beatsPerQuestionByTier: {
      ...base.beatsPerQuestionByTier,
      ...(presetOverrides.beatsPerQuestionByTier ?? {}),
      ...(overrides.beatsPerQuestionByTier ?? {}),
    },
    puzzleTimeBeatsByTier: {
      ...base.puzzleTimeBeatsByTier,
      ...(presetOverrides.puzzleTimeBeatsByTier ?? {}),
      ...(overrides.puzzleTimeBeatsByTier ?? {}),
    },
    phaseLengths: {
      ...base.phaseLengths,
      ...(presetOverrides.phaseLengths ?? {}),
      ...(overrides.phaseLengths ?? {}),
    },
    scoring: {
      ...base.scoring,
      ...(presetOverrides.scoring ?? {}),
      ...(overrides.scoring ?? {}),
    },
    flow: {
      ...base.flow,
      ...(presetOverrides.flow ?? {}),
      ...(overrides.flow ?? {}),
    },
    adaptive: {
      ...base.adaptive,
      ...(presetOverrides.adaptive ?? {}),
      ...(overrides.adaptive ?? {}),
    },
    antiSpam: {
      ...base.antiSpam,
      ...(presetOverrides.antiSpam ?? {}),
      ...(overrides.antiSpam ?? {}),
    },
    puzzleMix: {
      ...base.puzzleMix,
      ...(presetOverrides.puzzleMix ?? {}),
      ...(overrides.puzzleMix ?? {}),
    },
    memoryStepsByTier: {
      ...base.memoryStepsByTier,
      ...(presetOverrides.memoryStepsByTier ?? {}),
      ...(overrides.memoryStepsByTier ?? {}),
    },
    reactionWindowMsByTier: {
      ...base.reactionWindowMsByTier,
      ...(presetOverrides.reactionWindowMsByTier ?? {}),
      ...(overrides.reactionWindowMsByTier ?? {}),
    },
    bossComposition: {
      ...base.bossComposition,
      ...(presetOverrides.bossComposition ?? {}),
      ...(overrides.bossComposition ?? {}),
    },
    gradeThresholds:
      overrides.gradeThresholds ??
      presetOverrides.gradeThresholds ??
      base.gradeThresholds,
  };
}
