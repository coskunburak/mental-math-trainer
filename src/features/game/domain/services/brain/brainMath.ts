import type { AnswerEvent } from '@features/game/domain/entities/AnswerEvent';
import type { BrainPowerConfig } from '@features/game/domain/services/brain/BrainPowerConfig';

export interface WeightedValue {
  value: number;
  weight: number;
}

export interface SanitizedAnswerEvent extends AnswerEvent {
  occurredAtMs: number;
  difficultyTier: number;
  stepCount: number;
  responseTimeMs: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function parseIsoToMs(iso: string): number {
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toDateKey(iso: string): string {
  const ms = parseIsoToMs(iso);
  return new Date(ms).toISOString().slice(0, 10);
}

export function dateKeyFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isoFromDateKey(dateKey: string, hour = 0): string {
  return new Date(`${dateKey}T${hour.toString().padStart(2, '0')}:00:00.000Z`).toISOString();
}

export function addDays(dateKey: string, days: number): string {
  const base = Date.parse(`${dateKey}T00:00:00.000Z`);
  return dateKeyFromMs(base + days * 24 * 60 * 60 * 1000);
}

export function compareDateKey(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function percentile(values: readonly number[], pct: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = clamp01(pct) * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }

  const mix = rank - lowerIndex;
  return sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * mix;
}

export function mad(values: readonly number[]): number {
  const center = median(values);
  const deviations = values.map((value) => Math.abs(value - center));
  return median(deviations);
}

export function standardDeviation(values: readonly number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function winsorize(
  values: readonly number[],
  lowerPercentile: number,
  upperPercentile: number,
): number[] {
  if (values.length === 0) {
    return [];
  }

  const lowerBound = percentile(values, lowerPercentile);
  const upperBound = percentile(values, upperPercentile);

  return values.map((value) => clamp(value, lowerBound, upperBound));
}

export function trimmedMean(values: readonly number[], trimRatio: number): number {
  if (values.length === 0) {
    return 0;
  }

  if (values.length <= 2) {
    return mean(values);
  }

  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * clamp01(trimRatio));
  const start = Math.min(trimCount, sorted.length - 1);
  const end = Math.max(start + 1, sorted.length - trimCount);
  return mean(sorted.slice(start, end));
}

export function weightedTrimmedMean(weightedValues: readonly WeightedValue[], trimRatio: number): number {
  if (weightedValues.length === 0) {
    return 0;
  }

  const positiveWeights = weightedValues.filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0);
  if (positiveWeights.length === 0) {
    return 0;
  }

  const sorted = [...positiveWeights].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, entry) => sum + entry.weight, 0);

  const lowerCut = totalWeight * clamp01(trimRatio);
  const upperCut = totalWeight * (1 - clamp01(trimRatio));

  let consumedWeight = 0;
  let keptWeightedSum = 0;
  let keptWeight = 0;

  for (const entry of sorted) {
    const nextConsumed = consumedWeight + entry.weight;
    const keepStart = Math.max(consumedWeight, lowerCut);
    const keepEnd = Math.min(nextConsumed, upperCut);
    const keepWeight = Math.max(0, keepEnd - keepStart);

    if (keepWeight > 0) {
      keptWeightedSum += entry.value * keepWeight;
      keptWeight += keepWeight;
    }

    consumedWeight = nextConsumed;
  }

  if (keptWeight <= 0) {
    return mean(sorted.map((entry) => entry.value));
  }

  return keptWeightedSum / keptWeight;
}

export function logistic(value: number, midpoint = 0, slope = 1): number {
  const safeSlope = slope === 0 ? 1 : slope;
  return 1 / (1 + Math.exp(-(value - midpoint) / safeSlope));
}

export function normalizeResponseTime(
  responseTimeMs: number,
  floorMs: number,
): number {
  if (!Number.isFinite(responseTimeMs)) {
    return floorMs;
  }

  return Math.max(floorMs, Math.round(responseTimeMs));
}

export function sanitizeAnswerEvents(
  events: readonly AnswerEvent[],
  config: BrainPowerConfig,
): SanitizedAnswerEvent[] {
  const floorMs = config.normalization.responseTimeFloorMs;

  return events
    .map<SanitizedAnswerEvent>((event) => {
      const occurredAtMs = parseIsoToMs(event.occurredAt);
      return {
        ...event,
        occurredAtMs,
        difficultyTier: Math.max(1, Math.round(event.difficultyTier)),
        stepCount: Math.max(1, Math.round(event.stepCount)),
        responseTimeMs: normalizeResponseTime(event.responseTimeMs, floorMs),
      };
    })
    .sort((left, right) => left.occurredAtMs - right.occurredAtMs);
}

export function baselineMsForEvent(
  event: Pick<SanitizedAnswerEvent, 'operationType' | 'difficultyTier' | 'stepCount'>,
  config: BrainPowerConfig,
): number {
  const baseByOperation = config.normalization.baselineMsByOperation[event.operationType];
  const difficultyFactor = 1 + Math.max(0, event.difficultyTier - 1) * config.normalization.difficultyTierMultiplier;
  const stepFactor = 1 + Math.max(0, event.stepCount - 1) * config.normalization.stepCountMultiplier;

  return baseByOperation * difficultyFactor * stepFactor;
}

export function normalizedSpeed(
  responseMs: number,
  baselineMs: number,
  config: BrainPowerConfig,
): number {
  const normalized = logistic(baselineMs - responseMs, 0, config.normalization.sigmoidScaleMs);
  return clamp01(normalized);
}

export function difficultyWeight(difficultyTier: number, config: BrainPowerConfig): number {
  return 1 + Math.max(0, difficultyTier - 1) * config.normalization.difficultyWeightSlope;
}

export function relativeDeltaPct(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return ((current - previous) / previous) * 100;
}

export function toPercentile(values: readonly number[], value: number): number {
  if (values.length === 0) {
    return 0;
  }

  const lessThanCount = values.filter((item) => item < value).length;
  return lessThanCount / values.length;
}

export function robustWeakZ(value: number, population: readonly number[], epsilon: number): number {
  if (population.length === 0) {
    return 0;
  }

  const populationMedian = median(population);
  const populationMad = mad(population);
  if (populationMad > epsilon) {
    const scale = 1.4826 * populationMad;
    return (value - populationMedian) / scale;
  }

  const stdev = standardDeviation(population);
  if (stdev <= epsilon) {
    return 0;
  }

  return (value - mean(population)) / stdev;
}
