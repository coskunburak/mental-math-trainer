import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';
import type {
  NeuroFusionCalibrationResult,
  NeuroFusionGrade,
  NeuroFusionProgressData,
  NeuroFusionRunSummary,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

const CURRENT_SCHEMA_VERSION = 1;
const RUN_HISTORY_LIMIT = 30;

interface PersistedPayload {
  schemaVersion: number;
  data: unknown;
}

export const DEFAULT_NEURO_FUSION_PROGRESS: NeuroFusionProgressData = {
  bestScore: 0,
  bestGrade: null,
  runHistory: [],
  dailySeedByDate: {},
  calibration: null,
  totalTrackFragments: 0,
  totalCoins: 0,
};

export class NeuroFusionProgressStore {
  constructor(private readonly storage: KeyValueStore) {}

  async load(): Promise<NeuroFusionProgressData> {
    const raw = await this.storage.getString(storageKeys.neuroFusionProgress);
    if (!raw) {
      return DEFAULT_NEURO_FUSION_PROGRESS;
    }

    try {
      const payload = JSON.parse(raw) as PersistedPayload;
      if (!payload || typeof payload.schemaVersion !== 'number') {
        return DEFAULT_NEURO_FUSION_PROGRESS;
      }

      if (payload.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return DEFAULT_NEURO_FUSION_PROGRESS;
      }

      return normalizeProgress(payload.data as Partial<NeuroFusionProgressData>);
    } catch {
      return DEFAULT_NEURO_FUSION_PROGRESS;
    }
  }

  async save(progress: NeuroFusionProgressData): Promise<void> {
    const payload: PersistedPayload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data: normalizeProgress(progress),
    };

    await this.storage.setString(storageKeys.neuroFusionProgress, JSON.stringify(payload));
  }

  applyRunSummary(
    progress: NeuroFusionProgressData,
    summary: NeuroFusionRunSummary,
  ): NeuroFusionProgressData {
    const bestGrade = betterGrade(progress.bestGrade, summary.grade);

    return normalizeProgress({
      ...progress,
      bestScore: Math.max(progress.bestScore, summary.score),
      bestGrade,
      runHistory: [summary, ...progress.runHistory].slice(0, RUN_HISTORY_LIMIT),
      totalTrackFragments: progress.totalTrackFragments + summary.rewards.trackFragments,
      totalCoins: progress.totalCoins + summary.rewards.coins,
    });
  }

  upsertCalibration(
    progress: NeuroFusionProgressData,
    calibration: NeuroFusionCalibrationResult,
  ): NeuroFusionProgressData {
    return normalizeProgress({
      ...progress,
      calibration,
    });
  }

  resolveDailySeed(progress: NeuroFusionProgressData, dateKey: string): {
    seed: number;
    progress: NeuroFusionProgressData;
  } {
    const existing = progress.dailySeedByDate[dateKey];
    if (typeof existing === 'number' && Number.isFinite(existing)) {
      return {
        seed: existing,
        progress,
      };
    }

    const seed = buildDailySeed(dateKey);
    const next = normalizeProgress({
      ...progress,
      dailySeedByDate: {
        ...progress.dailySeedByDate,
        [dateKey]: seed,
      },
    });

    return {
      seed,
      progress: next,
    };
  }
}

function normalizeProgress(
  progress: Partial<NeuroFusionProgressData> | NeuroFusionProgressData,
): NeuroFusionProgressData {
  return {
    bestScore: Math.max(0, Math.floor(progress.bestScore ?? 0)),
    bestGrade: normalizeGrade(progress.bestGrade),
    runHistory: Array.isArray(progress.runHistory)
      ? progress.runHistory.slice(0, RUN_HISTORY_LIMIT)
      : [],
    dailySeedByDate:
      progress.dailySeedByDate && typeof progress.dailySeedByDate === 'object'
        ? sanitizeSeedMap(progress.dailySeedByDate as Record<string, unknown>)
        : {},
    calibration: normalizeCalibration(progress.calibration),
    totalTrackFragments: Math.max(0, Math.floor(progress.totalTrackFragments ?? 0)),
    totalCoins: Math.max(0, Math.floor(progress.totalCoins ?? 0)),
  };
}

function normalizeCalibration(
  calibration: NeuroFusionProgressData['calibration'] | unknown,
): NeuroFusionProgressData['calibration'] {
  if (!calibration || typeof calibration !== 'object') {
    return null;
  }

  const record = calibration as Record<string, unknown>;
  const offsetMs = Number(record.offsetMs);
  const stdDevMs = Number(record.stdDevMs);

  if (!Number.isFinite(offsetMs) || !Number.isFinite(stdDevMs)) {
    return null;
  }

  return {
    offsetMs: Math.round(offsetMs),
    stdDevMs: Math.max(0, Math.round(stdDevMs)),
  };
}

function sanitizeSeedMap(source: Record<string, unknown>): Record<string, number> {
  const next: Record<string, number> = {};

  Object.entries(source).forEach(([dateKey, value]) => {
    const seed = Number(value);
    if (!Number.isFinite(seed)) {
      return;
    }

    next[dateKey] = Math.floor(seed);
  });

  return next;
}

function normalizeGrade(grade: unknown): NeuroFusionGrade | null {
  if (grade === 'S' || grade === 'A' || grade === 'B' || grade === 'C') {
    return grade;
  }

  return null;
}

function betterGrade(
  current: NeuroFusionGrade | null,
  incoming: NeuroFusionGrade,
): NeuroFusionGrade {
  if (!current) {
    return incoming;
  }

  const order: NeuroFusionGrade[] = ['C', 'B', 'A', 'S'];
  return order.indexOf(incoming) > order.indexOf(current) ? incoming : current;
}

function buildDailySeed(dateKey: string): number {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 33 + dateKey.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}
