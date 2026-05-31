export const neuroPassXpSource = {
  run: 'run',
  dailyQuest: 'dailyQuest',
  weeklyQuest: 'weeklyQuest',
  bossWeekly: 'bossWeekly',
} as const;

export type NeuroPassXpSource = (typeof neuroPassXpSource)[keyof typeof neuroPassXpSource];
