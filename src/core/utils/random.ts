const MODULUS = 2 ** 31;
const MULTIPLIER = 1103515245;
const INCREMENT = 12345;

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = Math.abs(Math.floor(seed)) % MODULUS;
  }

  next(): number {
    this.state = (MULTIPLIER * this.state + INCREMENT) % MODULUS;
    return this.state / MODULUS;
  }

  nextInt(min: number, max: number): number {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);

    if (upper < lower) {
      throw new Error('max must be greater than or equal to min');
    }

    const value = this.next();
    return Math.floor(value * (upper - lower + 1)) + lower;
  }
}
