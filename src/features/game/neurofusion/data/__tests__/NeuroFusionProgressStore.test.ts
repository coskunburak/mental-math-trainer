import type { KeyValueStore } from '@core/storage/KeyValueStore';
import {
  DEFAULT_NEURO_FUSION_PROGRESS,
  NeuroFusionProgressStore,
} from '@features/game/neurofusion/data/NeuroFusionProgressStore';

class InMemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>();

  async getString(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('NeuroFusionProgressStore', () => {
  it('stores run summary and updates best score', () => {
    const store = new NeuroFusionProgressStore(new InMemoryStore());

    const next = store.applyRunSummary(DEFAULT_NEURO_FUSION_PROGRESS, {
      runId: 'nf-1',
      seed: 1,
      modeVariant: 'standard',
      preset: 'standard',
      bpm: 120,
      score: 1900,
      accuracy: 0.84,
      avgBeatOffsetMs: 82,
      bestCombo: 14,
      flowPeak: 76,
      phaseBreakdown: {
        rhythm_math: { score: 520, correct: 10, total: 12, perfect: 6, great: 2, good: 1, offbeat: 3 },
        puzzle: { score: 420, correct: 7, total: 9, perfect: 2, great: 3, good: 1, offbeat: 3 },
        cognitive_blend: { score: 560, correct: 8, total: 10, perfect: 3, great: 2, good: 2, offbeat: 3 },
        boss: { score: 400, correct: 6, total: 9, perfect: 2, great: 2, good: 1, offbeat: 4 },
      },
      grade: 'A',
      rewards: {
        tier: 'A',
        xp: 180,
        coins: 52,
        trackFragments: 4,
        weeklyLeaguePoints: 93,
        badges: ['Puzzle Master'],
      },
      startedAtMs: 1_000,
      endedAtMs: 181_000,
      durationSeconds: 180,
    });

    expect(next.bestScore).toBe(1900);
    expect(next.bestGrade).toBe('A');
    expect(next.totalCoins).toBe(52);
    expect(next.totalTrackFragments).toBe(4);
    expect(next.runHistory).toHaveLength(1);
  });

  it('resolves and persists daily seed per date', () => {
    const store = new NeuroFusionProgressStore(new InMemoryStore());

    const first = store.resolveDailySeed(DEFAULT_NEURO_FUSION_PROGRESS, '2026-02-20');
    const second = store.resolveDailySeed(first.progress, '2026-02-20');

    expect(first.seed).toBe(second.seed);
    expect(second.progress.dailySeedByDate['2026-02-20']).toBe(first.seed);
  });
});
