import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';
import type { BrainScore } from '@features/game/domain/entities/BrainScore';
import type { BrainScoreRepository } from '@features/game/domain/repositories/BrainScoreRepository';
import { Confidence } from '@features/game/domain/valueObjects/Confidence';
import { NormalizedMetric } from '@features/game/domain/valueObjects/NormalizedMetric';

const CURRENT_SCHEMA_VERSION = 1;

interface PersistedBrainScore {
  dateKey: string;
  window: {
    startedAt: string;
    endedAt: string;
    questionCount: number;
  };
  score: number;
  normalizedScore: number;
  components: {
    speed: number;
    accuracy: number;
    hardPerf: number;
  };
  confidence: number;
  quality: {
    guessingPenalty: number;
    spamPenalty: number;
    penaltyMultiplier: number;
    fastWrongRate: number;
    spamTapRuns: number;
  };
  coverage: {
    operationCoverage: number;
    difficultyCoverage: number;
    hardCoverage: number;
  };
}

interface PersistedPayload {
  schemaVersion: number;
  byDate: Record<string, PersistedBrainScore>;
}

export class BrainScoreStore implements BrainScoreRepository {
  constructor(private readonly storage: KeyValueStore) {}

  async saveDaily(score: BrainScore): Promise<void> {
    await this.saveDailyMany([score]);
  }

  async saveDailyMany(scores: readonly BrainScore[]): Promise<void> {
    if (scores.length === 0) {
      return;
    }

    const existing = await this.loadPayload();

    for (const score of scores) {
      existing.byDate[score.dateKey] = serializeScore(score);
    }

    await this.storage.setString(
      storageKeys.brainScores,
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        byDate: existing.byDate,
      }),
    );
  }

  async getDaily(dateKey: string): Promise<BrainScore | null> {
    const payload = await this.loadPayload();
    const score = payload.byDate[dateKey];

    return score ? deserializeScore(score) : null;
  }

  async listBetween(startDateKey: string, endDateKey: string): Promise<BrainScore[]> {
    const payload = await this.loadPayload();
    return Object.values(payload.byDate)
      .filter((score) => score.dateKey >= startDateKey && score.dateKey <= endDateKey)
      .sort((left, right) => (left.dateKey < right.dateKey ? -1 : 1))
      .map((score) => deserializeScore(score));
  }

  private async loadPayload(): Promise<PersistedPayload> {
    const raw = await this.storage.getString(storageKeys.brainScores);

    if (!raw) {
      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        byDate: {},
      };
    }

    try {
      const parsed = JSON.parse(raw) as PersistedPayload;
      if (!parsed || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION || typeof parsed.byDate !== 'object') {
        return {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          byDate: {},
        };
      }

      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        byDate: parsed.byDate ?? {},
      };
    } catch {
      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        byDate: {},
      };
    }
  }
}

function serializeScore(score: BrainScore): PersistedBrainScore {
  return {
    dateKey: score.dateKey,
    window: score.window,
    score: score.score,
    normalizedScore: score.normalizedScore.value,
    components: {
      speed: score.components.speed.value,
      accuracy: score.components.accuracy.value,
      hardPerf: score.components.hardPerf.value,
    },
    confidence: score.confidence.value,
    quality: score.quality,
    coverage: score.coverage,
  };
}

function deserializeScore(score: PersistedBrainScore): BrainScore {
  return {
    dateKey: score.dateKey,
    window: score.window,
    score: score.score,
    normalizedScore: NormalizedMetric.from(score.normalizedScore),
    components: {
      speed: NormalizedMetric.from(score.components.speed),
      accuracy: NormalizedMetric.from(score.components.accuracy),
      hardPerf: NormalizedMetric.from(score.components.hardPerf),
    },
    confidence: Confidence.from(score.confidence),
    quality: score.quality,
    coverage: score.coverage,
  };
}
