import {
  classifyNeuroPassSeasonState,
  computeNeuroPassDayLeft,
} from '@features/neuroPass/domain/types/NeuroPassSeasonState';

describe('NeuroPass season state', () => {
  const startAtUtc = new Date('2026-02-01T00:00:00.000Z');
  const endAtUtc = new Date('2026-03-01T00:00:00.000Z');
  const graceEndAtUtc = new Date('2026-03-08T00:00:00.000Z');

  it('classifies preseason before startAt', () => {
    const state = classifyNeuroPassSeasonState({
      nowUtc: new Date('2026-01-25T00:00:00.000Z'),
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });

    expect(state).toBe('preseason');
  });

  it('classifies active and computes dayLeft to endAt', () => {
    const nowUtc = new Date('2026-02-10T12:00:00.000Z');
    const state = classifyNeuroPassSeasonState({
      nowUtc,
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });

    expect(state).toBe('active');

    const dayLeft = computeNeuroPassDayLeft({
      nowUtc,
      state,
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });

    expect(dayLeft).toBe(19);
  });

  it('classifies grace and ended', () => {
    const graceState = classifyNeuroPassSeasonState({
      nowUtc: new Date('2026-03-04T00:00:00.000Z'),
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });
    expect(graceState).toBe('grace');

    const endedState = classifyNeuroPassSeasonState({
      nowUtc: new Date('2026-03-09T00:00:00.000Z'),
      startAtUtc,
      endAtUtc,
      graceEndAtUtc,
    });
    expect(endedState).toBe('ended');
  });
});
