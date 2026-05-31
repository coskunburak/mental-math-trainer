import { clampInt, clampNumber } from '@features/neuroPass/domain/utils/math';

const FAST_INTERVAL_MS = 80;
const ULTRA_FAST_INTERVAL_MS = 65;
const CONSTANT_INTERVAL_DELTA_MS = 6;

export interface SpamTapDetectorInput {
  submissionTimestampsMs?: number[];
  tapTimestampsMs?: number[];
  repeatedIdenticalInputFastCount?: number;
  identicalInputBurstCount?: number;
}

export interface SpamTapDetectionResult {
  spamScore: number;
  penalty: number;
  stats: {
    sampleCount: number;
    highFrequencyRatio: number;
    ultraFastRatio: number;
    constantBurstScore: number;
    repeatedInputScore: number;
  };
}

export class SpamTapDetector {
  detect(input: SpamTapDetectorInput): SpamTapDetectionResult {
    const timestamps = normalizeTimestamps(
      input.submissionTimestampsMs?.length ? input.submissionTimestampsMs : input.tapTimestampsMs,
    );

    const intervals = buildIntervals(timestamps);
    const highFrequencyRatio = ratio(intervals, (value) => value > 0 && value < FAST_INTERVAL_MS);
    const ultraFastRatio = ratio(intervals, (value) => value > 0 && value < ULTRA_FAST_INTERVAL_MS);
    const constantBurstScore = computeConstantBurstScore(intervals);

    const repeatedFast = Math.max(0, Math.floor(Number(input.repeatedIdenticalInputFastCount ?? 0)));
    const identicalBursts = Math.max(0, Math.floor(Number(input.identicalInputBurstCount ?? 0)));
    const repeatedInputScore = clampNumber(
      repeatedFast / 10 + identicalBursts / 8,
      0,
      1,
    );

    const spamScore = clampNumber(
      highFrequencyRatio * 0.42
        + ultraFastRatio * 0.2
        + constantBurstScore * 0.26
        + repeatedInputScore * 0.12,
      0,
      1,
    );

    return {
      spamScore,
      penalty: clampInt(Math.round(spamScore * 60), 0, 60),
      stats: {
        sampleCount: timestamps.length,
        highFrequencyRatio,
        ultraFastRatio,
        constantBurstScore,
        repeatedInputScore,
      },
    };
  }
}

function normalizeTimestamps(values: number[] | undefined): number[] {
  if (!Array.isArray(values) || values.length < 2) {
    return [];
  }

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)
    .slice(-200);
}

function buildIntervals(values: number[]): number[] {
  if (values.length < 2) {
    return [];
  }

  const intervals: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) {
      intervals.push(diff);
    }
  }

  return intervals;
}

function ratio(values: number[], predicate: (value: number) => boolean): number {
  if (values.length === 0) {
    return 0;
  }

  const matching = values.reduce((sum, value) => sum + (predicate(value) ? 1 : 0), 0);
  return matching / values.length;
}

function computeConstantBurstScore(intervals: number[]): number {
  if (intervals.length < 4) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < intervals.length; i += 1) {
    const previous = intervals[i - 1];
    const currentValue = intervals[i];
    const almostSame = Math.abs(currentValue - previous) <= CONSTANT_INTERVAL_DELTA_MS;

    if (almostSame && currentValue < 220) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return clampNumber((longest - 4) / 10, 0, 1);
}
