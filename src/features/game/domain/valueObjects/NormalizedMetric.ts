export class NormalizedMetric {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static from(value: number): NormalizedMetric {
    if (!Number.isFinite(value)) {
      return new NormalizedMetric(0);
    }

    return new NormalizedMetric(Math.min(1, Math.max(0, value)));
  }

  toPercentage(): number {
    return Math.round(this.value * 100);
  }
}
