import type { NeuroPassSecurityConfig } from '@features/neuroPass/domain/config/NeuroPassSecurityConfig';

export interface NeuroPassTimeHeuristicState {
  lastSeenWallClockUtc?: string;
  lastSeenMonotonicMs?: number;
  suspiciousTime: boolean;
  stableSamples: number;
  lastDeltaMs?: number;
}

export interface TimeSpoofHeuristicInput {
  wallClockUtcIso: string;
  monotonicMs?: number;
}

export interface TimeSpoofHeuristicResult {
  nextState: NeuroPassTimeHeuristicState;
  suspicious: boolean;
  triggered: boolean;
  severity: 'none' | 'low' | 'high';
  deltaMs: number;
}

const INITIAL_STATE: NeuroPassTimeHeuristicState = {
  suspiciousTime: false,
  stableSamples: 0,
};

export class TimeSpoofHeuristic {
  evaluate(
    previous: NeuroPassTimeHeuristicState | null | undefined,
    input: TimeSpoofHeuristicInput,
    config: NeuroPassSecurityConfig,
  ): TimeSpoofHeuristicResult {
    const prior = normalizeState(previous);
    const wallMs = Date.parse(input.wallClockUtcIso);
    if (!Number.isFinite(wallMs)) {
      return {
        nextState: prior,
        suspicious: prior.suspiciousTime,
        triggered: false,
        severity: 'none',
        deltaMs: 0,
      };
    }

    const previousWallMs = prior.lastSeenWallClockUtc ? Date.parse(prior.lastSeenWallClockUtc) : NaN;
    const hasReference = Number.isFinite(previousWallMs);

    if (!hasReference) {
      return {
        nextState: {
          ...prior,
          lastSeenWallClockUtc: new Date(wallMs).toISOString(),
          lastSeenMonotonicMs: sanitizeMonotonic(input.monotonicMs),
          stableSamples: 1,
        },
        suspicious: prior.suspiciousTime,
        triggered: false,
        severity: 'none',
        deltaMs: 0,
      };
    }

    const deltaWallMs = wallMs - (previousWallMs as number);
    const monotonicNow = sanitizeMonotonic(input.monotonicMs);
    const previousMonotonic = sanitizeMonotonic(prior.lastSeenMonotonicMs);

    let suspiciousReason: 'none' | 'backward' | 'forward_jump' | 'drift' = 'none';

    if (deltaWallMs < -Math.abs(config.suspiciousBackwardJumpMs)) {
      suspiciousReason = 'backward';
    } else if (deltaWallMs > Math.abs(config.suspiciousForwardJumpMs)) {
      suspiciousReason = 'forward_jump';
    }

    if (
      suspiciousReason === 'none'
      && monotonicNow !== undefined
      && previousMonotonic !== undefined
      && monotonicNow >= previousMonotonic
    ) {
      const deltaMonotonic = monotonicNow - previousMonotonic;
      const drift = Math.abs(deltaWallMs - deltaMonotonic);
      if (drift > Math.abs(config.suspiciousClockDriftMs)) {
        suspiciousReason = 'drift';
      }
    }

    const isSuspiciousNow = suspiciousReason !== 'none';
    const stableSamples = isSuspiciousNow
      ? 0
      : prior.suspiciousTime
        ? prior.stableSamples + 1
        : Math.max(1, prior.stableSamples + 1);

    const suspicious = isSuspiciousNow
      ? true
      : prior.suspiciousTime
        ? stableSamples < Math.max(1, config.suspiciousStabilizeSamples)
        : false;

    return {
      nextState: {
        lastSeenWallClockUtc: new Date(wallMs).toISOString(),
        lastSeenMonotonicMs: monotonicNow,
        suspiciousTime: suspicious,
        stableSamples,
        lastDeltaMs: deltaWallMs,
      },
      suspicious,
      triggered: isSuspiciousNow,
      severity: classifySeverity(suspiciousReason),
      deltaMs: deltaWallMs,
    };
  }
}

function classifySeverity(reason: 'none' | 'backward' | 'forward_jump' | 'drift'): 'none' | 'low' | 'high' {
  switch (reason) {
    case 'backward':
    case 'forward_jump':
      return 'high';
    case 'drift':
      return 'low';
    default:
      return 'none';
  }
}

function normalizeState(state: NeuroPassTimeHeuristicState | null | undefined): NeuroPassTimeHeuristicState {
  if (!state) {
    return { ...INITIAL_STATE };
  }

  return {
    lastSeenWallClockUtc:
      typeof state.lastSeenWallClockUtc === 'string' && Number.isFinite(Date.parse(state.lastSeenWallClockUtc))
        ? state.lastSeenWallClockUtc
        : undefined,
    lastSeenMonotonicMs: sanitizeMonotonic(state.lastSeenMonotonicMs),
    suspiciousTime: Boolean(state.suspiciousTime),
    stableSamples: Number.isFinite(state.stableSamples)
      ? Math.max(0, Math.floor(state.stableSamples))
      : 0,
    lastDeltaMs: Number.isFinite(state.lastDeltaMs) ? Number(state.lastDeltaMs) : undefined,
  };
}

function sanitizeMonotonic(value: unknown): number | undefined {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }

  return numeric;
}
