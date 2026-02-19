export interface TimerPolicy {
  totalDurationMs: number;
  tickIntervalMs: number;
}

export interface TimerSnapshot {
  elapsedMs: number;
  remainingMs: number;
  finished: boolean;
}

export class TimerEngine {
  private elapsedMs = 0;

  constructor(private readonly policy: TimerPolicy) {}

  reset(): void {
    this.elapsedMs = 0;
  }

  tick(deltaMs = this.policy.tickIntervalMs): TimerSnapshot {
    this.elapsedMs = Math.min(this.policy.totalDurationMs, this.elapsedMs + Math.max(deltaMs, 0));

    return {
      elapsedMs: this.elapsedMs,
      remainingMs: Math.max(0, this.policy.totalDurationMs - this.elapsedMs),
      finished: this.elapsedMs >= this.policy.totalDurationMs,
    };
  }
}
