import type { AnimationStyle } from '@features/theme/domain/entities/GameTheme';

const baseMotion = {
  fast: 120,
  normal: 220,
  slow: 340,
} as const;

export interface MotionTokens {
  fast: number;
  normal: number;
  slow: number;
}

const multipliers: Record<AnimationStyle, number> = {
  subtle: 1,
  energetic: 0.85,
  glow: 1.08,
  cyber: 0.78,
};

export function createMotion(style: AnimationStyle): MotionTokens {
  const factor = multipliers[style] ?? 1;

  return {
    fast: Math.round(baseMotion.fast * factor),
    normal: Math.round(baseMotion.normal * factor),
    slow: Math.round(baseMotion.slow * factor),
  };
}

export const motion = baseMotion;
