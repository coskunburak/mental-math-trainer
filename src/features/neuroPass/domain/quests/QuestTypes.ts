export const neuroPassQuestPeriod = {
  daily: 'daily',
  weekly: 'weekly',
  bossWeekly: 'bossWeekly',
} as const;

export type NeuroPassQuestPeriod =
  (typeof neuroPassQuestPeriod)[keyof typeof neuroPassQuestPeriod];

export const neuroPassQuestStatus = {
  active: 'active',
  completed: 'completed',
  claimed: 'claimed',
} as const;

export type NeuroPassQuestStatus =
  (typeof neuroPassQuestStatus)[keyof typeof neuroPassQuestStatus];

export const neuroPassQuestProgressUnit = {
  count: 'count',
  percent: 'percent',
  ms: 'ms',
  points: 'points',
} as const;

export type NeuroPassQuestProgressUnit =
  (typeof neuroPassQuestProgressUnit)[keyof typeof neuroPassQuestProgressUnit];

export const neuroPassQuestDifficultyTag = {
  easy: 'easy',
  medium: 'med',
  hard: 'hard',
} as const;

export type NeuroPassQuestDifficultyTag =
  (typeof neuroPassQuestDifficultyTag)[keyof typeof neuroPassQuestDifficultyTag];

export const neuroPassQuestType = {
  completeRuns: 'complete_runs',
  accuracyThreshold: 'accuracy_threshold',
  comboThreshold: 'combo_threshold',
  gradeAtLeast: 'grade_at_least',
  antiSpamSafeRun: 'anti_spam_safe_run',
  allPhasesRun: 'all_phases_run',
  beatPrecision: 'beat_precision',
  totalQuestions: 'total_questions',
  sGradeCount: 's_grade_count',
  bossCompletions: 'boss_completions',
  runXpTotal: 'run_xp_total',
  distinctDaysPlayed: 'distinct_days_played',
  totalDurationMinutes: 'total_duration_minutes',
} as const;

export type NeuroPassQuestType =
  (typeof neuroPassQuestType)[keyof typeof neuroPassQuestType];

export const NEURO_PASS_DAILY_QUEST_COUNT = 3;
export const NEURO_PASS_WEEKLY_QUEST_COUNT = 5;

export const NEURO_PASS_DAILY_QUEST_NXP = 120;
export const NEURO_PASS_WEEKLY_QUEST_NXP = 320;
export const NEURO_PASS_BOSS_WEEKLY_NXP = 400;

export const NEURO_PASS_BOSS_WEEKLY_QUEST_ID = 'boss_weekly';
export const NEURO_PASS_BOSS_WEEKLY_TITLE = 'Defeat Boss Phase';
export const NEURO_PASS_BOSS_WEEKLY_DESCRIPTION = 'Complete 1 Boss phase run this week.';
