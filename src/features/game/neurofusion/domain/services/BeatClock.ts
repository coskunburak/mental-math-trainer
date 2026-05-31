import type {
  NeuroFusionBeatClassification,
  NeuroFusionBeatWindowMs,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

interface BeatClockOptions {
  bpm: number;
  startedAtMs: number;
  calibrationOffsetMs?: number;
  driftCorrectionFactor?: number;
}

export class BeatClock {
  readonly beatDurationMs: number;

  private readonly startedAtMs: number;
  private readonly calibrationOffsetMs: number;
  private readonly driftCorrectionFactor: number;

  private driftMs = 0;

  constructor(options: BeatClockOptions) {
    const bpm = Math.max(60, Math.min(220, options.bpm));
    this.beatDurationMs = 60_000 / bpm;
    this.startedAtMs = options.startedAtMs;
    this.calibrationOffsetMs = options.calibrationOffsetMs ?? 0;
    this.driftCorrectionFactor = options.driftCorrectionFactor ?? 0.08;
  }

  getBeatIndex(timestampMs: number): number {
    const elapsed = timestampMs - this.startedAtMs + this.driftMs;
    return Math.max(0, Math.floor(elapsed / this.beatDurationMs));
  }

  getBeatTimestamp(beatIndex: number): number {
    return this.startedAtMs + beatIndex * this.beatDurationMs - this.driftMs;
  }

  getNearestBeatIndex(timestampMs: number): number {
    const elapsed = timestampMs - this.startedAtMs + this.driftMs;
    return Math.max(0, Math.round(elapsed / this.beatDurationMs));
  }

  applyAudioPosition(audioPositionMs: number, timestampMs: number): void {
    const expectedPositionMs = timestampMs - this.startedAtMs + this.driftMs;
    const error = audioPositionMs - expectedPositionMs;
    this.driftMs += error * this.driftCorrectionFactor;
  }

  classifyAgainstBeat(
    timestampMs: number,
    beatIndex: number,
    windows: NeuroFusionBeatWindowMs,
    windowScale = 1,
  ): NeuroFusionBeatClassification {
    const safeScale = Math.max(0.55, Math.min(1.8, windowScale));
    const adjusted = {
      perfect: windows.perfect * safeScale,
      great: windows.great * safeScale,
      good: windows.good * safeScale,
    };

    const targetTimestamp = this.getBeatTimestamp(beatIndex) + this.calibrationOffsetMs;
    const offsetMs = timestampMs - targetTimestamp;
    const absOffset = Math.abs(offsetMs);

    if (absOffset <= adjusted.perfect) {
      return {
        beatAccuracy: 'perfect',
        beatOffsetMs: Math.round(offsetMs),
      };
    }

    if (absOffset <= adjusted.great) {
      return {
        beatAccuracy: 'great',
        beatOffsetMs: Math.round(offsetMs),
      };
    }

    if (absOffset <= adjusted.good) {
      return {
        beatAccuracy: 'good',
        beatOffsetMs: Math.round(offsetMs),
      };
    }

    return {
      beatAccuracy: 'offbeat',
      beatOffsetMs: Math.round(offsetMs),
    };
  }
}
