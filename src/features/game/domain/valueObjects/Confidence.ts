export class Confidence {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static from(value: number): Confidence {
    if (!Number.isFinite(value)) {
      return new Confidence(0);
    }

    return new Confidence(Math.min(1, Math.max(0, value)));
  }

  isLow(threshold = 0.6): boolean {
    return this.value < threshold;
  }
}
