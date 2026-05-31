import type { NeuroFusionCalibrationResult } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

export interface CalibrateBeatOffsetInput {
  tapTimestampsMs: number[];
  bpm: number;
  referenceStartMs?: number;
}

export class CalibrateBeatOffset {
  execute(input: CalibrateBeatOffsetInput): NeuroFusionCalibrationResult {
    const sorted = [...input.tapTimestampsMs]
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    if (sorted.length < 6) {
      return {
        offsetMs: 0,
        stdDevMs: 999,
      };
    }

    const beatDurationMs = 60_000 / clamp(input.bpm, 60, 220);
    const referenceStartMs = input.referenceStartMs ?? sorted[0];

    const residuals = sorted.map((tapMs) => {
      const beatIndex = Math.round((tapMs - referenceStartMs) / beatDurationMs);
      const expected = referenceStartMs + beatIndex * beatDurationMs;
      return tapMs - expected;
    });

    const mean = residuals.reduce((sum, value) => sum + value, 0) / residuals.length;
    const variance =
      residuals.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(1, residuals.length - 1);

    return {
      offsetMs: Math.round(mean),
      stdDevMs: Math.round(Math.sqrt(variance)),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
