export interface Difficulty {
  level: number;
  minLevel: number;
  maxLevel: number;
}

export function clampDifficulty(level: number, minLevel: number, maxLevel: number): number {
  return Math.max(minLevel, Math.min(maxLevel, level));
}
