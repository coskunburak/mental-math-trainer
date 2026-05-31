import type { NeuroPassRunGrade, NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';

import type {
  NeuroPassQuestDifficultyTag,
  NeuroPassQuestPeriod,
  NeuroPassQuestProgressUnit,
  NeuroPassQuestType,
} from './QuestTypes';
import type { NeuroPassQuestState } from './NeuroPassQuestState';

export interface NeuroPassQuestRunSummary {
  runId: string;
  endedAtUtc: string;
  grade: NeuroPassRunGrade;
  accuracy: number;
  bestCombo: number;
  avgBeatOffsetMs: number;
  totalQuestions: number;
  durationMs: number;
  phasesPlayed: string[];
  antiSpamPenalty: number;
  bossCompleted: boolean;
}

export interface NeuroPassQuestEvaluatorInput {
  state: NeuroPassQuestState;
  runSummary: NeuroPassQuestRunSummary;
  ledgerGrants: NeuroPassXpGrant[];
  dailyKey: string;
  weeklyKey: string;
}

export type NeuroPassQuestEvaluator = (input: NeuroPassQuestEvaluatorInput) => number;

export interface NeuroPassQuestDefinition {
  id: string;
  period: NeuroPassQuestPeriod;
  type: NeuroPassQuestType;
  title: string;
  description: string;
  target: number;
  progressUnit: NeuroPassQuestProgressUnit;
  difficultyTag?: NeuroPassQuestDifficultyTag;
  evaluator: NeuroPassQuestEvaluator;
}
