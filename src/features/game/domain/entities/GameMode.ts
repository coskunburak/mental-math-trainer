export type GameMode = 'custom' | 'daily' | 'sprint' | 'survival' | 'zen';

export const gameModeLabels: Record<GameMode, string> = {
  custom: 'Custom',
  daily: 'Daily',
  sprint: 'Sprint',
  survival: 'Survival',
  zen: 'Zen',
};

export interface GameModePolicy {
  mode: GameMode;
  timed: boolean;
  defaultDurationSeconds: number;
  endsOnMistake: boolean;
  questionLimit?: number;
}

export const GAME_MODE_POLICIES: Record<GameMode, GameModePolicy> = {
  custom: {
    mode: 'custom',
    timed: true,
    defaultDurationSeconds: 120,
    endsOnMistake: false,
    questionLimit: 20,
  },
  daily: {
    mode: 'daily',
    timed: true,
    defaultDurationSeconds: 90,
    endsOnMistake: false,
    questionLimit: 12,
  },
  sprint: {
    mode: 'sprint',
    timed: true,
    defaultDurationSeconds: 60,
    endsOnMistake: false,
  },
  survival: {
    mode: 'survival',
    timed: true,
    defaultDurationSeconds: 180,
    endsOnMistake: true,
  },
  zen: {
    mode: 'zen',
    timed: false,
    defaultDurationSeconds: 0,
    endsOnMistake: false,
  },
};
