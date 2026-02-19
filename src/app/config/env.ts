export type RuntimeEnv = 'development' | 'test' | 'production';

export interface EnvConfig {
  runtime: RuntimeEnv;
  sessionDurationSeconds: number;
  difficultyFloor: number;
  difficultyCeiling: number;
}

const DEFAULTS: EnvConfig = {
  runtime: 'development',
  sessionDurationSeconds: 60,
  difficultyFloor: 1,
  difficultyCeiling: 20,
};

function parseEnvName(value: string | undefined): RuntimeEnv {
  if (value === 'production' || value === 'test') {
    return value;
  }

  return 'development';
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env: EnvConfig = {
  runtime: parseEnvName(process.env.NODE_ENV),
  sessionDurationSeconds: parseNumber(process.env.EXPO_PUBLIC_SESSION_DURATION_SECONDS, DEFAULTS.sessionDurationSeconds),
  difficultyFloor: parseNumber(process.env.EXPO_PUBLIC_DIFFICULTY_FLOOR, DEFAULTS.difficultyFloor),
  difficultyCeiling: parseNumber(process.env.EXPO_PUBLIC_DIFFICULTY_CEILING, DEFAULTS.difficultyCeiling),
};
