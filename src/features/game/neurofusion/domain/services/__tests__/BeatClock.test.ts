import { BeatClock } from '@features/game/neurofusion/domain/services/BeatClock';

describe('BeatClock', () => {
  it('classifies beat windows with calibration offset', () => {
    const startedAtMs = 1_000;
    const clock = new BeatClock({
      bpm: 120,
      startedAtMs,
      calibrationOffsetMs: 20,
    });

    const windows = {
      perfect: 60,
      great: 120,
      good: 200,
    };

    const beatTimestamp = clock.getBeatTimestamp(4);

    const perfect = clock.classifyAgainstBeat(beatTimestamp + 20 + 30, 4, windows);
    expect(perfect.beatAccuracy).toBe('perfect');

    const great = clock.classifyAgainstBeat(beatTimestamp + 20 + 100, 4, windows);
    expect(great.beatAccuracy).toBe('great');

    const good = clock.classifyAgainstBeat(beatTimestamp + 20 + 170, 4, windows);
    expect(good.beatAccuracy).toBe('good');

    const offbeat = clock.classifyAgainstBeat(beatTimestamp + 20 + 260, 4, windows);
    expect(offbeat.beatAccuracy).toBe('offbeat');
  });
});
