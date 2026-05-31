import { getDefaultNeuroFusionConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import type {
  NeuroFusionGrade,
  NeuroFusionRunState,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { buildRewardBundle, gradeRun } from '@features/game/neurofusion/domain/services/NeuroFusionRewards';

describe('Neuro Fusion balance tuning', () => {
  it('maps target P50/P75/P90 profiles to expected grades and reward economy', () => {
    const config = getDefaultNeuroFusionConfig();

    const p50 = evaluateProfile({
      score: 1625,
      accuracy: 0.78,
      avgBeatOffsetMs: 128,
      bestCombo: 12,
      flowPeak: 70,
    });
    const p75 = evaluateProfile({
      score: 2140,
      accuracy: 0.85,
      avgBeatOffsetMs: 96,
      bestCombo: 16,
      flowPeak: 82,
    });
    const p90 = evaluateProfile({
      score: 2670,
      accuracy: 0.92,
      avgBeatOffsetMs: 68,
      bestCombo: 21,
      flowPeak: 94,
    });

    expect(gradeRun(p50.state, config)).toBe('B');
    expect(gradeRun(p75.state, config)).toBe('A');
    expect(gradeRun(p90.state, config)).toBe('S');

    expect(p50.rewards.xp).toBeGreaterThanOrEqual(190);
    expect(p50.rewards.xp).toBeLessThanOrEqual(250);
    expect(p50.rewards.coins).toBeGreaterThanOrEqual(68);
    expect(p50.rewards.coins).toBeLessThanOrEqual(95);
    expect(p50.rewards.trackFragments).toBeGreaterThanOrEqual(3);
    expect(p50.rewards.trackFragments).toBeLessThanOrEqual(5);

    expect(p75.rewards.xp).toBeGreaterThanOrEqual(245);
    expect(p75.rewards.xp).toBeLessThanOrEqual(320);
    expect(p75.rewards.coins).toBeGreaterThanOrEqual(90);
    expect(p75.rewards.coins).toBeLessThanOrEqual(120);
    expect(p75.rewards.trackFragments).toBeGreaterThanOrEqual(4);
    expect(p75.rewards.trackFragments).toBeLessThanOrEqual(6);

    expect(p90.rewards.xp).toBeGreaterThanOrEqual(310);
    expect(p90.rewards.xp).toBeLessThanOrEqual(390);
    expect(p90.rewards.coins).toBeGreaterThanOrEqual(115);
    expect(p90.rewards.coins).toBeLessThanOrEqual(150);
    expect(p90.rewards.trackFragments).toBeGreaterThanOrEqual(5);
    expect(p90.rewards.trackFragments).toBeLessThanOrEqual(7);
  });

  it('keeps reward ordering monotonic across profile tiers', () => {
    const p50 = evaluateProfile({
      score: 1625,
      accuracy: 0.78,
      avgBeatOffsetMs: 128,
      bestCombo: 12,
      flowPeak: 70,
    });
    const p75 = evaluateProfile({
      score: 2140,
      accuracy: 0.85,
      avgBeatOffsetMs: 96,
      bestCombo: 16,
      flowPeak: 82,
    });
    const p90 = evaluateProfile({
      score: 2670,
      accuracy: 0.92,
      avgBeatOffsetMs: 68,
      bestCombo: 21,
      flowPeak: 94,
    });

    expect(p75.rewards.xp).toBeGreaterThan(p50.rewards.xp);
    expect(p90.rewards.xp).toBeGreaterThan(p75.rewards.xp);
    expect(p75.rewards.coins).toBeGreaterThan(p50.rewards.coins);
    expect(p90.rewards.coins).toBeGreaterThan(p75.rewards.coins);
    expect(p75.rewards.trackFragments).toBeGreaterThanOrEqual(p50.rewards.trackFragments);
    expect(p90.rewards.trackFragments).toBeGreaterThanOrEqual(p75.rewards.trackFragments);
  });
});

function evaluateProfile(input: {
  score: number;
  accuracy: number;
  avgBeatOffsetMs: number;
  bestCombo: number;
  flowPeak: number;
}): {
  state: NeuroFusionRunState;
  grade: NeuroFusionGrade;
  rewards: ReturnType<typeof buildRewardBundle>;
} {
  const totalAnswers = 40;
  const correctAnswers = Math.round(totalAnswers * input.accuracy);

  const state = buildMockState({
    score: input.score,
    totalAnswers,
    correctAnswers,
    avgBeatOffsetMs: input.avgBeatOffsetMs,
    bestCombo: input.bestCombo,
    flowPeak: input.flowPeak,
  });

  const grade = gradeRun(state, getDefaultNeuroFusionConfig());
  const rewards = buildRewardBundle(state, grade);

  return {
    state,
    grade,
    rewards,
  };
}

function buildMockState(input: {
  score: number;
  totalAnswers: number;
  correctAnswers: number;
  avgBeatOffsetMs: number;
  bestCombo: number;
  flowPeak: number;
}): NeuroFusionRunState {
  return {
    runId: 'mock-run',
    seed: 1,
    modeVariant: 'standard',
    preset: 'standard',
    status: 'finished',
    startedAtMs: 0,
    endedAtMs: 180_000,
    beatDurationMs: 500,
    totalBeats: 360,
    beatIndex: 360,
    phaseIndex: 3,
    phases: [],
    currentPhase: 'boss',
    currentItem: null,
    nextItemSequence: 0,
    progress: {
      score: input.score,
      combo: 0,
      bestCombo: input.bestCombo,
      flow: input.flowPeak,
      insightMultiplier: 1,
      totalAnswers: input.totalAnswers,
      correctAnswers: input.correctAnswers,
      averageBeatOffsetMs: input.avgBeatOffsetMs,
      beatOffsetSamples: input.totalAnswers,
    },
    flowPeak: input.flowPeak,
    phaseBreakdown: {
      rhythm_math: {
        score: Math.round(input.score * 0.3),
        correct: Math.round(input.correctAnswers * 0.3),
        total: Math.round(input.totalAnswers * 0.3),
        perfect: 6,
        great: 5,
        good: 3,
        offbeat: 2,
      },
      puzzle: {
        score: Math.round(input.score * 0.24),
        correct: Math.round(input.correctAnswers * 0.24),
        total: Math.round(input.totalAnswers * 0.22),
        perfect: 4,
        great: 3,
        good: 2,
        offbeat: 1,
      },
      cognitive_blend: {
        score: Math.round(input.score * 0.26),
        correct: Math.round(input.correctAnswers * 0.26),
        total: Math.round(input.totalAnswers * 0.25),
        perfect: 4,
        great: 3,
        good: 2,
        offbeat: 1,
      },
      boss: {
        score: Math.round(input.score * 0.2),
        correct: Math.round(input.correctAnswers * 0.2),
        total: input.totalAnswers - Math.round(input.totalAnswers * 0.3) - Math.round(input.totalAnswers * 0.22) - Math.round(input.totalAnswers * 0.25),
        perfect: 2,
        great: 2,
        good: 1,
        offbeat: 2,
      },
    },
    puzzleStats: {
      missing_sequence: { correct: 4, total: 5 },
      mixed_operation_pattern: { correct: 3, total: 4 },
      grid_mini: { correct: 3, total: 4 },
      odd_one_out: { correct: 3, total: 4 },
      equation_balance: { correct: 3, total: 4 },
      quick_estimate: { correct: 2, total: 3 },
    },
    beatStats: {
      perfect: 16,
      great: 13,
      good: 8,
      offbeat: 7,
    },
    dynamic: {
      windowScale: 1,
      beatsPerQuestion: 3,
      reactionWindowMs: 640,
      memorySteps: 4,
      difficultyTier: 3,
    },
    spamFlags: 0,
    calibrationOffsetMs: 0,
    calibrationStdDevMs: 40,
    trackId: 'metro_130',
    summary: null,
    bossQueue: [],
    lastPuzzleTypes: [],
    cognitiveToggle: 'echo_stack',
    timingAdjustedAtBeat: 0,
  };
}
