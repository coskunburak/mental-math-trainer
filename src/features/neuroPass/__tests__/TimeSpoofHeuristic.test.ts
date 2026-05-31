import {
  TimeSpoofHeuristic,
  type NeuroPassTimeHeuristicState,
} from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import { DEFAULT_NEURO_PASS_SECURITY_CONFIG } from '@features/neuroPass/domain/config/NeuroPassSecurityConfig';

describe('TimeSpoofHeuristic', () => {
  const heuristic = new TimeSpoofHeuristic();

  it('does not flag the first observation', () => {
    const result = heuristic.evaluate(
      null,
      {
        wallClockUtcIso: '2026-02-21T12:00:00.000Z',
        monotonicMs: 1000,
      },
      DEFAULT_NEURO_PASS_SECURITY_CONFIG,
    );

    expect(result.suspicious).toBe(false);
    expect(result.triggered).toBe(false);
  });

  it('flags backward wall-clock jumps as suspicious', () => {
    const state: NeuroPassTimeHeuristicState = {
      lastSeenWallClockUtc: '2026-02-21T12:00:00.000Z',
      lastSeenMonotonicMs: 1000,
      suspiciousTime: false,
      stableSamples: 1,
    };

    const result = heuristic.evaluate(
      state,
      {
        wallClockUtcIso: '2026-02-21T11:40:00.000Z',
        monotonicMs: 1100,
      },
      DEFAULT_NEURO_PASS_SECURITY_CONFIG,
    );

    expect(result.triggered).toBe(true);
    expect(result.suspicious).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('returns to stable state after consecutive non-suspicious samples', () => {
    let state: NeuroPassTimeHeuristicState = {
      lastSeenWallClockUtc: '2026-02-21T12:00:00.000Z',
      lastSeenMonotonicMs: 1000,
      suspiciousTime: true,
      stableSamples: 0,
    };

    const inputs = [
      { wallClockUtcIso: '2026-02-21T12:01:00.000Z', monotonicMs: 61000 },
      { wallClockUtcIso: '2026-02-21T12:02:00.000Z', monotonicMs: 121000 },
      { wallClockUtcIso: '2026-02-21T12:03:00.000Z', monotonicMs: 181000 },
    ];

    let last = null as ReturnType<TimeSpoofHeuristic['evaluate']> | null;
    inputs.forEach((input) => {
      last = heuristic.evaluate(state, input, DEFAULT_NEURO_PASS_SECURITY_CONFIG);
      state = last.nextState;
    });

    expect(last?.suspicious).toBe(false);
    expect(last?.nextState.stableSamples).toBeGreaterThanOrEqual(3);
  });
});
