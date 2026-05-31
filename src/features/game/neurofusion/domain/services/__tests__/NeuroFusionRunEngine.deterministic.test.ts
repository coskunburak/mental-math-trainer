import { NeuroFusionRunEngine } from '@features/game/neurofusion/domain/services/NeuroFusionRunEngine';

describe('NeuroFusionRunEngine deterministic generation', () => {
  it('produces the same sequence for the same seed and answer pattern', () => {
    const first = collectSequence(81237);
    const second = collectSequence(81237);

    expect(first).toEqual(second);
  });

  it('produces a different sequence for a different seed', () => {
    const first = collectSequence(81237);
    const second = collectSequence(81238);

    expect(first).not.toEqual(second);
  });
});

function collectSequence(seed: number): string[] {
  const engine = new NeuroFusionRunEngine();
  let state = engine.startRun({
    seed,
    startedAtMs: 1_000,
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

  const sequence: string[] = [];

  for (let index = 0; index < 14; index += 1) {
    state = engine.getState();
    const item = state.currentItem;
    if (!item) {
      break;
    }

    sequence.push(fingerprint(item));

    const submitTime = Math.round(state.startedAtMs + item.targetBeat * state.beatDurationMs);

    if (item.kind === 'rhythm_question') {
      engine.submitAnswer({ submittedAtMs: submitTime, numericAnswer: item.answer });
    } else if (item.kind === 'puzzle') {
      engine.submitAnswer({ submittedAtMs: submitTime, optionIndex: item.correctOptionIndex });
    } else if (item.kind === 'memory_stack') {
      engine.submitAnswer({ submittedAtMs: submitTime, numericAnswer: item.answer });
    } else {
      engine.submitAnswer({ submittedAtMs: submitTime, booleanAnswer: item.expected });
    }

    engine.nextBeatTick(submitTime + state.beatDurationMs);
  }

  return sequence;
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
