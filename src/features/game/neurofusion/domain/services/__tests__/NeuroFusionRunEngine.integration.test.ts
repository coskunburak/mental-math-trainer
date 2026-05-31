import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

import { neuroFusionGoldenFixture } from './fixtures/neuroFusionGoldenFixture';

describe('NeuroFusionRunEngine integration', () => {
  it('transitions phases exactly at configured beat boundaries', () => {
    const engine = new NeuroFusionRunEngine();
    const state = engine.startRun({
      seed: 999,
      startedAtMs: 2_000,
      preset: 'standard',
      configOverrides: {
        runDurationSeconds: 120,
        phaseLengths: {
          rhythmMath: 8,
          puzzle: 8,
          cognitiveBlend: 8,
          boss: 24,
        },
      },
    });

    state.phases.slice(0, 6).forEach((phase) => {
      const timestamp = Math.round(state.startedAtMs + phase.startBeat * state.beatDurationMs);
      engine.nextBeatTick(timestamp);
      const snapshot = engine.getState();
      expect(snapshot.currentPhase).toBe(phase.type);
      expect(snapshot.phaseIndex).toBe(phase.index);
    });
  });

  it('matches golden fixture for deterministic sequence and score', () => {
    const result = runGoldenSimulation();

    expect(result.firstFingerprints).toEqual(neuroFusionGoldenFixture.expectedFirstFingerprints);
    expect(result.score).toBe(neuroFusionGoldenFixture.expectedFinalScore);
    expect(result.grade).toBe(neuroFusionGoldenFixture.expectedFinalGrade);
  });
});

function runGoldenSimulation(): {
  firstFingerprints: string[];
  score: number;
  grade: string;
} {
  const engine = new NeuroFusionRunEngine();
  const state = engine.startRun({
    seed: neuroFusionGoldenFixture.seed,
    startedAtMs: neuroFusionGoldenFixture.startedAtMs,
    preset: 'standard',
    configOverrides: {
      runDurationSeconds: 120,
      phaseLengths: {
        rhythmMath: 8,
        puzzle: 8,
        cognitiveBlend: 8,
        boss: 24,
      },
    },
  });

  const firstFingerprints: string[] = [];

  for (let turn = 0; turn < 24; turn += 1) {
    const current = engine.getState();
    const item = current.currentItem;
    if (!item) {
      break;
    }

    if (firstFingerprints.length < 6) {
      firstFingerprints.push(fingerprint(item));
    }

    const submitAt = Math.round(
      current.startedAtMs + item.targetBeat * current.beatDurationMs + (turn % 3 === 0 ? 12 : 72),
    );

    const shouldBeCorrect = turn % 5 !== 4;

    if (item.kind === 'rhythm_question') {
      engine.submitAnswer({
        submittedAtMs: submitAt,
        numericAnswer: shouldBeCorrect ? item.answer : item.answer + 1,
      });
    } else if (item.kind === 'puzzle') {
      engine.submitAnswer({
        submittedAtMs: submitAt,
        optionIndex: shouldBeCorrect
          ? item.correctOptionIndex
          : (item.correctOptionIndex + 1) % item.options.length,
      });
    } else if (item.kind === 'memory_stack') {
      engine.submitAnswer({
        submittedAtMs: submitAt,
        numericAnswer: shouldBeCorrect ? item.answer : item.answer + 2,
      });
    } else {
      engine.submitAnswer({
        submittedAtMs: submitAt,
        booleanAnswer: shouldBeCorrect ? item.expected : !item.expected,
      });
    }

    engine.nextBeatTick(submitAt + current.beatDurationMs);
  }

  const done = engine.endRun({ endedAtMs: state.startedAtMs + state.totalBeats * state.beatDurationMs });

  if (!done.summary) {
    throw new Error('Summary missing at end of simulation');
  }

  return {
    firstFingerprints,
    score: done.summary.score,
    grade: done.summary.grade,
  };
}

function fingerprint(item: NonNullable<ReturnType<NeuroFusionRunEngine['getState']>['currentItem']>): string {
  if (item.kind === 'rhythm_question') {
    return `r:${item.prompt}`;
  }

  if (item.kind === 'puzzle') {
    return `p:${item.puzzleType}:${item.prompt}:${item.options[item.correctOptionIndex]}`;
  }

  if (item.kind === 'memory_stack') {
    return `m:${item.prompt}:${item.answer}`;
  }

  return `g:${item.prompt}:${item.expected}`;
}
