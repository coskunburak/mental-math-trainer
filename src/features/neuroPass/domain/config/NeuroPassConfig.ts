export interface NeuroPassConfig {
  softCapThreshold: number;
  hardCapThreshold: number;
  softCapMultiplier: number;
  rhythmBonusWeight: number;
  comboBonusWeight: number;
  antiSpamScale: number;
  manifestOverrideVersion: number;
  manifestOverrideKey: string;
}

export interface NeuroPassConfigValidationIssue {
  key: keyof NeuroPassConfig;
  reason: string;
  input?: unknown;
}

export const DEFAULT_NEURO_PASS_CONFIG: NeuroPassConfig = {
  softCapThreshold: 900,
  hardCapThreshold: 1200,
  softCapMultiplier: 0.35,
  rhythmBonusWeight: 1,
  comboBonusWeight: 1,
  antiSpamScale: 1,
  manifestOverrideVersion: 0,
  manifestOverrideKey: '',
};

const CONFIG_BOUNDS = {
  softCapThreshold: [0, 5000],
  hardCapThreshold: [0, 5000],
  softCapMultiplier: [0, 1],
  rhythmBonusWeight: [0, 2],
  comboBonusWeight: [0, 2],
  antiSpamScale: [0, 2],
  manifestOverrideVersion: [0, 9999],
} as const;

export function sanitizeNeuroPassConfig(
  input: Partial<NeuroPassConfig>,
  fallback: NeuroPassConfig = DEFAULT_NEURO_PASS_CONFIG,
): { config: NeuroPassConfig; issues: NeuroPassConfigValidationIssue[] } {
  const issues: NeuroPassConfigValidationIssue[] = [];

  const softCapThreshold = sanitizeInt(
    'softCapThreshold',
    input.softCapThreshold,
    fallback.softCapThreshold,
    CONFIG_BOUNDS.softCapThreshold,
    issues,
  );

  const hardCapThresholdRaw = sanitizeInt(
    'hardCapThreshold',
    input.hardCapThreshold,
    fallback.hardCapThreshold,
    CONFIG_BOUNDS.hardCapThreshold,
    issues,
  );

  let hardCapThreshold = hardCapThresholdRaw;
  if (hardCapThreshold < softCapThreshold) {
    issues.push({
      key: 'hardCapThreshold',
      reason: 'hard cap cannot be lower than soft cap',
      input: hardCapThreshold,
    });
    hardCapThreshold = softCapThreshold;
  }

  const softCapMultiplier = sanitizeFloat(
    'softCapMultiplier',
    input.softCapMultiplier,
    fallback.softCapMultiplier,
    CONFIG_BOUNDS.softCapMultiplier,
    issues,
  );

  const rhythmBonusWeight = sanitizeFloat(
    'rhythmBonusWeight',
    input.rhythmBonusWeight,
    fallback.rhythmBonusWeight,
    CONFIG_BOUNDS.rhythmBonusWeight,
    issues,
  );

  const comboBonusWeight = sanitizeFloat(
    'comboBonusWeight',
    input.comboBonusWeight,
    fallback.comboBonusWeight,
    CONFIG_BOUNDS.comboBonusWeight,
    issues,
  );

  const antiSpamScale = sanitizeFloat(
    'antiSpamScale',
    input.antiSpamScale,
    fallback.antiSpamScale,
    CONFIG_BOUNDS.antiSpamScale,
    issues,
  );

  const manifestOverrideVersion = sanitizeInt(
    'manifestOverrideVersion',
    input.manifestOverrideVersion,
    fallback.manifestOverrideVersion,
    CONFIG_BOUNDS.manifestOverrideVersion,
    issues,
  );

  const manifestOverrideKey =
    typeof input.manifestOverrideKey === 'string'
      ? input.manifestOverrideKey.trim().slice(0, 128)
      : fallback.manifestOverrideKey;

  return {
    config: {
      softCapThreshold,
      hardCapThreshold,
      softCapMultiplier,
      rhythmBonusWeight,
      comboBonusWeight,
      antiSpamScale,
      manifestOverrideVersion,
      manifestOverrideKey,
    },
    issues,
  };
}

function sanitizeInt(
  key: keyof NeuroPassConfig,
  input: unknown,
  fallback: number,
  bounds: readonly [min: number, max: number],
  issues: NeuroPassConfigValidationIssue[],
): number {
  const numeric = Number(input);

  if (!Number.isFinite(numeric)) {
    if (input !== undefined) {
      issues.push({
        key,
        reason: 'not a finite number',
        input,
      });
    }
    return fallback;
  }

  const rounded = Math.round(numeric);
  const clamped = Math.min(bounds[1], Math.max(bounds[0], rounded));

  if (clamped !== rounded) {
    issues.push({
      key,
      reason: `out of bounds [${bounds[0]}, ${bounds[1]}]`,
      input,
    });
  }

  return clamped;
}

function sanitizeFloat(
  key: keyof NeuroPassConfig,
  input: unknown,
  fallback: number,
  bounds: readonly [min: number, max: number],
  issues: NeuroPassConfigValidationIssue[],
): number {
  const numeric = Number(input);

  if (!Number.isFinite(numeric)) {
    if (input !== undefined) {
      issues.push({
        key,
        reason: 'not a finite number',
        input,
      });
    }
    return fallback;
  }

  const clamped = Math.min(bounds[1], Math.max(bounds[0], numeric));

  if (clamped !== numeric) {
    issues.push({
      key,
      reason: `out of bounds [${bounds[0]}, ${bounds[1]}]`,
      input,
    });
  }

  return Number(clamped.toFixed(4));
}
