import type {
  NeuroPassQuestDifficultyTag,
  NeuroPassQuestPeriod,
  NeuroPassQuestProgressUnit,
  NeuroPassQuestStatus,
  NeuroPassQuestType,
} from './QuestTypes';

export interface NeuroPassQuestState {
  questId: string;
  period: NeuroPassQuestPeriod;
  periodKey: string;
  type: NeuroPassQuestType;
  title: string;
  description: string;
  progress: number;
  target: number;
  progressUnit: NeuroPassQuestProgressUnit;
  rewardNxp: number;
  status: NeuroPassQuestStatus;
  difficultyTag?: NeuroPassQuestDifficultyTag;
  claimedAtUtc?: string;
  completedAtUtc?: string;
}

export interface NeuroPassQuestsStateBundle {
  seasonId: string;
  dailyKey: string;
  weeklyKey: string;
  daily: NeuroPassQuestState[];
  weekly: NeuroPassQuestState[];
  bossWeekly: NeuroPassQuestState | null;
}

export interface NeuroPassQuestProgressEvent {
  period: NeuroPassQuestPeriod;
  questId: string;
  progress: number;
  target: number;
}

export interface NeuroPassQuestCompletedEvent {
  period: NeuroPassQuestPeriod;
  questId: string;
}
