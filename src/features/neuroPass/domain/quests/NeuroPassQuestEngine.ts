import type { NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import { clampNumber } from '@features/neuroPass/domain/utils/math';
import { utcDayKey } from '@features/neuroPass/domain/utils/time';

import type {
  NeuroPassQuestDefinition,
  NeuroPassQuestEvaluatorInput,
  NeuroPassQuestRunSummary,
} from './NeuroPassQuestDefinition';
import {
  type NeuroPassQuestCompletedEvent,
  type NeuroPassQuestProgressEvent,
  type NeuroPassQuestState,
  type NeuroPassQuestsStateBundle,
} from './NeuroPassQuestState';
import {
  NEURO_PASS_BOSS_WEEKLY_DESCRIPTION,
  NEURO_PASS_BOSS_WEEKLY_NXP,
  NEURO_PASS_BOSS_WEEKLY_QUEST_ID,
  NEURO_PASS_BOSS_WEEKLY_TITLE,
  NEURO_PASS_DAILY_QUEST_COUNT,
  NEURO_PASS_DAILY_QUEST_NXP,
  NEURO_PASS_WEEKLY_QUEST_COUNT,
  NEURO_PASS_WEEKLY_QUEST_NXP,
  neuroPassQuestPeriod,
  neuroPassQuestProgressUnit,
  neuroPassQuestStatus,
  neuroPassQuestType,
} from './QuestTypes';
import { isDateKeyInWeeklyKey } from '../utils/periodKeys';

interface QuestInitInput {
  seasonId: string;
  dailyKey: string;
  weeklyKey: string;
  storedState: NeuroPassQuestsStateBundle | null;
}

export interface QuestInitResult {
  state: NeuroPassQuestsStateBundle;
  didResetDaily: boolean;
  didResetWeekly: boolean;
  changed: boolean;
}

interface QuestApplyInput {
  state: NeuroPassQuestsStateBundle;
  runSummary: NeuroPassQuestRunSummary;
  ledgerGrants: NeuroPassXpGrant[];
}

export interface QuestApplyResult {
  state: NeuroPassQuestsStateBundle;
  changed: boolean;
  progressed: NeuroPassQuestProgressEvent[];
  completed: NeuroPassQuestCompletedEvent[];
}

const REQUIRED_PHASES = ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'];
const GRADE_RANK: Record<'C' | 'B' | 'A' | 'S', number> = {
  C: 0,
  B: 1,
  A: 2,
  S: 3,
};

const dailyQuestPool: NeuroPassQuestDefinition[] = [
  createCompleteRunsQuest('d_runs_1', 1, neuroPassQuestPeriod.daily, 'easy'),
  createCompleteRunsQuest('d_runs_2', 2, neuroPassQuestPeriod.daily, 'med'),
  createAccuracyQuest('d_accuracy_80', 0.8, neuroPassQuestPeriod.daily, 'easy'),
  createAccuracyQuest('d_accuracy_90', 0.9, neuroPassQuestPeriod.daily, 'hard'),
  createComboQuest('d_combo_18', 18, neuroPassQuestPeriod.daily, 'med'),
  createGradeQuest('d_grade_b', 'B', neuroPassQuestPeriod.daily, 'easy'),
  createGradeQuest('d_grade_a', 'A', neuroPassQuestPeriod.daily, 'hard'),
  createAntiSpamQuest('d_clean_run', 15, neuroPassQuestPeriod.daily, 'med'),
  createAllPhasesQuest('d_all_phases', neuroPassQuestPeriod.daily, 'med'),
  createBeatPrecisionQuest('d_rhythm_95ms', 95, neuroPassQuestPeriod.daily, 'hard'),
  createQuestionVolumeQuest('d_questions_35', 35, neuroPassQuestPeriod.daily, 'med'),
];

const weeklyQuestPool: NeuroPassQuestDefinition[] = [
  createCompleteRunsQuest('w_runs_10', 10, neuroPassQuestPeriod.weekly, 'easy'),
  createCompleteRunsQuest('w_runs_16', 16, neuroPassQuestPeriod.weekly, 'med'),
  createSGradeCountQuest('w_s_grade_3', 3, 'hard'),
  createSGradeCountQuest('w_s_grade_5', 5, 'hard'),
  createComboCountQuest('w_combo_22_x4', 22, 4, 'med'),
  createComboCountQuest('w_combo_28_x3', 28, 3, 'hard'),
  createBossCompletionQuest('w_boss_3', 3, 'med'),
  createRunXpTotalQuest('w_run_nxp_1800', 1800, 'med'),
  createDistinctDaysQuest('w_distinct_days_4', 4, 'med'),
  createDurationQuest('w_duration_75', 75, 'easy'),
  createAllPhasesTimesQuest('w_all_phases_6', 6, 'med'),
];

const bossWeeklyDefinition: NeuroPassQuestDefinition = {
  id: NEURO_PASS_BOSS_WEEKLY_QUEST_ID,
  period: neuroPassQuestPeriod.bossWeekly,
  type: neuroPassQuestType.bossCompletions,
  title: NEURO_PASS_BOSS_WEEKLY_TITLE,
  description: NEURO_PASS_BOSS_WEEKLY_DESCRIPTION,
  target: 1,
  progressUnit: neuroPassQuestProgressUnit.count,
  difficultyTag: 'hard',
  evaluator: (input) => input.state.progress + (input.runSummary.bossCompleted ? 1 : 0),
};

const definitionById = new Map<string, NeuroPassQuestDefinition>([
  ...dailyQuestPool.map((definition) => [definition.id, definition] as const),
  ...weeklyQuestPool.map((definition) => [definition.id, definition] as const),
  [bossWeeklyDefinition.id, bossWeeklyDefinition],
]);

export class NeuroPassQuestEngine {
  generateDailyQuests(seasonId: string, dailyKey: string): NeuroPassQuestState[] {
    const selected = this.selectDefinitions(
      dailyQuestPool,
      NEURO_PASS_DAILY_QUEST_COUNT,
      `${seasonId}:${dailyKey}:daily`,
    );

    return selected.map((definition) =>
      this.createQuestState(definition, dailyKey, NEURO_PASS_DAILY_QUEST_NXP),
    );
  }

  generateWeeklyQuests(seasonId: string, weeklyKey: string): NeuroPassQuestState[] {
    const selected = this.selectDefinitions(
      weeklyQuestPool,
      NEURO_PASS_WEEKLY_QUEST_COUNT,
      `${seasonId}:${weeklyKey}:weekly`,
    );

    return selected.map((definition) =>
      this.createQuestState(definition, weeklyKey, NEURO_PASS_WEEKLY_QUEST_NXP),
    );
  }

  generateBossWeeklyQuest(weeklyKey: string): NeuroPassQuestState {
    return this.createQuestState(bossWeeklyDefinition, weeklyKey, NEURO_PASS_BOSS_WEEKLY_NXP);
  }

  initOrReset(input: QuestInitInput): QuestInitResult {
    const base = this.normalizeStoredState(input.storedState);
    const seasonChanged = base.seasonId !== input.seasonId;

    let changed = seasonChanged;
    let didResetDaily = seasonChanged;
    let didResetWeekly = seasonChanged;

    let daily = base.daily;
    if (seasonChanged || base.dailyKey !== input.dailyKey || !this.isQuestArrayValid(base.daily, neuroPassQuestPeriod.daily, input.dailyKey, NEURO_PASS_DAILY_QUEST_COUNT)) {
      daily = this.generateDailyQuests(input.seasonId, input.dailyKey);
      changed = true;
      didResetDaily = true;
    }

    let weekly = base.weekly;
    let bossWeekly = base.bossWeekly;

    if (seasonChanged || base.weeklyKey !== input.weeklyKey || !this.isQuestArrayValid(base.weekly, neuroPassQuestPeriod.weekly, input.weeklyKey, NEURO_PASS_WEEKLY_QUEST_COUNT)) {
      weekly = this.generateWeeklyQuests(input.seasonId, input.weeklyKey);
      bossWeekly = this.generateBossWeeklyQuest(input.weeklyKey);
      changed = true;
      didResetWeekly = true;
    } else if (!this.isBossQuestValid(base.bossWeekly, input.weeklyKey)) {
      bossWeekly = this.generateBossWeeklyQuest(input.weeklyKey);
      changed = true;
      didResetWeekly = true;
    }

    const state: NeuroPassQuestsStateBundle = {
      seasonId: input.seasonId,
      dailyKey: input.dailyKey,
      weeklyKey: input.weeklyKey,
      daily,
      weekly,
      bossWeekly,
    };

    return {
      state,
      didResetDaily,
      didResetWeekly,
      changed,
    };
  }

  applyRunSummaryToQuests(input: QuestApplyInput): QuestApplyResult {
    const progressed: NeuroPassQuestProgressEvent[] = [];
    const completed: NeuroPassQuestCompletedEvent[] = [];

    const daily = input.state.daily.map((quest) =>
      this.applyRunToQuest({
        quest,
        runSummary: input.runSummary,
        ledgerGrants: input.ledgerGrants,
        dailyKey: input.state.dailyKey,
        weeklyKey: input.state.weeklyKey,
        progressed,
        completed,
      }),
    );

    const weekly = input.state.weekly.map((quest) =>
      this.applyRunToQuest({
        quest,
        runSummary: input.runSummary,
        ledgerGrants: input.ledgerGrants,
        dailyKey: input.state.dailyKey,
        weeklyKey: input.state.weeklyKey,
        progressed,
        completed,
      }),
    );

    const bossWeekly = input.state.bossWeekly
      ? this.applyRunToQuest({
        quest: input.state.bossWeekly,
        runSummary: input.runSummary,
        ledgerGrants: input.ledgerGrants,
        dailyKey: input.state.dailyKey,
        weeklyKey: input.state.weeklyKey,
        progressed,
        completed,
      })
      : null;

    const changed = progressed.length > 0 || completed.length > 0;

    return {
      state: {
        ...input.state,
        daily,
        weekly,
        bossWeekly,
      },
      changed,
      progressed,
      completed,
    };
  }

  private applyRunToQuest(input: {
    quest: NeuroPassQuestState;
    runSummary: NeuroPassQuestRunSummary;
    ledgerGrants: NeuroPassXpGrant[];
    dailyKey: string;
    weeklyKey: string;
    progressed: NeuroPassQuestProgressEvent[];
    completed: NeuroPassQuestCompletedEvent[];
  }): NeuroPassQuestState {
    const { quest } = input;

    if (quest.status === neuroPassQuestStatus.claimed) {
      return quest;
    }

    const definition = definitionById.get(quest.questId);
    if (!definition) {
      return quest;
    }

    const evaluatorInput: NeuroPassQuestEvaluatorInput = {
      state: quest,
      runSummary: input.runSummary,
      ledgerGrants: input.ledgerGrants,
      dailyKey: input.dailyKey,
      weeklyKey: input.weeklyKey,
    };

    const nextProgressRaw = definition.evaluator(evaluatorInput);
    const nextProgress = clampNumber(nextProgressRaw, 0, quest.target);

    if (nextProgress <= quest.progress && quest.status === neuroPassQuestStatus.completed) {
      return quest;
    }

    let nextStatus = quest.status;
    let completedAtUtc = quest.completedAtUtc;

    if (nextProgress >= quest.target && quest.status === neuroPassQuestStatus.active) {
      nextStatus = neuroPassQuestStatus.completed;
      completedAtUtc = normalizeIso(input.runSummary.endedAtUtc) ?? new Date().toISOString();
      input.completed.push({
        period: quest.period,
        questId: quest.questId,
      });
    }

    if (nextProgress > quest.progress) {
      input.progressed.push({
        period: quest.period,
        questId: quest.questId,
        progress: nextProgress,
        target: quest.target,
      });
    }

    if (nextProgress === quest.progress && nextStatus === quest.status && completedAtUtc === quest.completedAtUtc) {
      return quest;
    }

    return {
      ...quest,
      progress: nextProgress,
      status: nextStatus,
      completedAtUtc,
    };
  }

  private selectDefinitions(
    pool: NeuroPassQuestDefinition[],
    count: number,
    seedKey: string,
  ): NeuroPassQuestDefinition[] {
    const seeded = this.shuffle(pool, seedKey);

    const selected: NeuroPassQuestDefinition[] = [];
    const usedTypes = new Set<string>();

    for (const definition of seeded) {
      if (selected.length >= count) {
        break;
      }

      if (!usedTypes.has(definition.type)) {
        selected.push(definition);
        usedTypes.add(definition.type);
      }
    }

    if (selected.length < count) {
      for (const definition of seeded) {
        if (selected.length >= count) {
          break;
        }

        if (selected.some((item) => item.id === definition.id)) {
          continue;
        }

        selected.push(definition);
      }
    }

    return selected;
  }

  private shuffle(pool: NeuroPassQuestDefinition[], seedKey: string): NeuroPassQuestDefinition[] {
    const result = [...pool];
    const random = createSeededRandom(hashString(seedKey));

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const temp = result[index];
      result[index] = result[swapIndex] as NeuroPassQuestDefinition;
      result[swapIndex] = temp as NeuroPassQuestDefinition;
    }

    return result;
  }

  private createQuestState(
    definition: NeuroPassQuestDefinition,
    periodKey: string,
    rewardNxp: number,
  ): NeuroPassQuestState {
    return {
      questId: definition.id,
      period: definition.period,
      periodKey,
      type: definition.type,
      title: definition.title,
      description: definition.description,
      progress: 0,
      target: definition.target,
      progressUnit: definition.progressUnit,
      rewardNxp,
      status: neuroPassQuestStatus.active,
      difficultyTag: definition.difficultyTag,
    };
  }

  private isQuestArrayValid(
    list: NeuroPassQuestState[],
    period: NeuroPassQuestState['period'],
    periodKey: string,
    expectedLength: number,
  ): boolean {
    if (!Array.isArray(list) || list.length !== expectedLength) {
      return false;
    }

    const seen = new Set<string>();
    return list.every((quest) => {
      if (!quest || typeof quest !== 'object') {
        return false;
      }

      if (quest.period !== period || quest.periodKey !== periodKey) {
        return false;
      }

      if (!definitionById.has(quest.questId)) {
        return false;
      }

      if (seen.has(quest.questId)) {
        return false;
      }

      seen.add(quest.questId);
      return true;
    });
  }

  private isBossQuestValid(quest: NeuroPassQuestState | null, weeklyKey: string): boolean {
    return Boolean(
      quest
      && quest.questId === bossWeeklyDefinition.id
      && quest.period === neuroPassQuestPeriod.bossWeekly
      && quest.periodKey === weeklyKey,
    );
  }

  private normalizeStoredState(value: NeuroPassQuestsStateBundle | null): NeuroPassQuestsStateBundle {
    if (!value) {
      return {
        seasonId: '',
        dailyKey: '',
        weeklyKey: '',
        daily: [],
        weekly: [],
        bossWeekly: null,
      };
    }

    return {
      seasonId: typeof value.seasonId === 'string' ? value.seasonId : '',
      dailyKey: typeof value.dailyKey === 'string' ? value.dailyKey : '',
      weeklyKey: typeof value.weeklyKey === 'string' ? value.weeklyKey : '',
      daily: Array.isArray(value.daily) ? value.daily : [],
      weekly: Array.isArray(value.weekly) ? value.weekly : [],
      bossWeekly: value.bossWeekly ?? null,
    };
  }
}

function normalizeIso(value: string): string | undefined {
  return Number.isNaN(Date.parse(value)) ? undefined : value;
}

function hasAllRequiredPhases(phasesPlayed: string[]): boolean {
  const set = new Set(phasesPlayed);
  return REQUIRED_PHASES.every((phase) => set.has(phase));
}

function isGradeAtLeast(grade: 'C' | 'B' | 'A' | 'S', minimum: 'C' | 'B' | 'A' | 'S'): boolean {
  return GRADE_RANK[grade] >= GRADE_RANK[minimum];
}

function createCompleteRunsQuest(
  id: string,
  target: number,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.completeRuns,
    title: `Complete ${target} Fusion Runs`,
    description: `Finish ${target} Neuro Fusion run${target > 1 ? 's' : ''}.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) => input.state.progress + 1,
  };
}

function createAccuracyQuest(
  id: string,
  threshold: number,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  const percentage = Math.round(threshold * 100);
  return {
    id,
    period,
    type: neuroPassQuestType.accuracyThreshold,
    title: `Accuracy ${percentage}%+`,
    description: `Finish a run with at least ${percentage}% accuracy.`,
    target: 1,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (input.runSummary.accuracy >= threshold ? 1 : 0),
  };
}

function createComboQuest(
  id: string,
  comboTarget: number,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.comboThreshold,
    title: `Reach Combo ${comboTarget}`,
    description: `Hit combo ${comboTarget}+ in any run.`,
    target: 1,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (input.runSummary.bestCombo >= comboTarget ? 1 : 0),
  };
}

function createGradeQuest(
  id: string,
  minimumGrade: 'C' | 'B' | 'A' | 'S',
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.gradeAtLeast,
    title: `Earn Grade ${minimumGrade}+`,
    description: `Finish a run at grade ${minimumGrade} or higher.`,
    target: 1,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (isGradeAtLeast(input.runSummary.grade, minimumGrade) ? 1 : 0),
  };
}

function createAntiSpamQuest(
  id: string,
  maxPenalty: number,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.antiSpamSafeRun,
    title: 'Clean Input Run',
    description: `Finish a run with anti-spam penalty <= ${maxPenalty}.`,
    target: 1,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (input.runSummary.antiSpamPenalty <= maxPenalty ? 1 : 0),
  };
}

function createAllPhasesQuest(
  id: string,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.allPhasesRun,
    title: 'Play All 4 Phases',
    description: 'Complete one run touching Rhythm, Puzzle, Cognitive and Boss phases.',
    target: 1,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (hasAllRequiredPhases(input.runSummary.phasesPlayed) ? 1 : 0),
  };
}

function createAllPhasesTimesQuest(
  id: string,
  target: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.allPhasesRun,
    title: `All Phases x${target}`,
    description: `Play all 4 phases in ${target} runs this week.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (hasAllRequiredPhases(input.runSummary.phasesPlayed) ? 1 : 0),
  };
}

function createBeatPrecisionQuest(
  id: string,
  maxOffsetMs: number,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.beatPrecision,
    title: `Beat Focus <= ${maxOffsetMs}ms`,
    description: `Finish a run with average beat offset <= ${maxOffsetMs} ms.`,
    target: 1,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (Math.abs(input.runSummary.avgBeatOffsetMs) <= maxOffsetMs ? 1 : 0),
  };
}

function createQuestionVolumeQuest(
  id: string,
  target: number,
  period: 'daily' | 'weekly',
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period,
    type: neuroPassQuestType.totalQuestions,
    title: `Solve ${target} Questions`,
    description: `Answer ${target} questions in total.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) => input.state.progress + Math.max(0, input.runSummary.totalQuestions),
  };
}

function createSGradeCountQuest(
  id: string,
  target: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.sGradeCount,
    title: `Get S Grade x${target}`,
    description: `Finish ${target} runs with S grade this week.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) => input.state.progress + (input.runSummary.grade === 'S' ? 1 : 0),
  };
}

function createComboCountQuest(
  id: string,
  comboThreshold: number,
  target: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.comboThreshold,
    title: `Combo ${comboThreshold}+ x${target}`,
    description: `Hit combo ${comboThreshold}+ in ${target} runs this week.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) =>
      input.state.progress + (input.runSummary.bestCombo >= comboThreshold ? 1 : 0),
  };
}

function createBossCompletionQuest(
  id: string,
  target: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.bossCompletions,
    title: `Defeat Boss x${target}`,
    description: `Complete boss challenge ${target} times this week.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) => input.state.progress + (input.runSummary.bossCompleted ? 1 : 0),
  };
}

function createRunXpTotalQuest(
  id: string,
  target: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.runXpTotal,
    title: `Earn ${target} Run NXP`,
    description: `Accumulate ${target} NXP from runs this week.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.points,
    difficultyTag,
    evaluator: (input) => getWeeklyRunXpTotal(input.ledgerGrants, input.weeklyKey),
  };
}

function createDistinctDaysQuest(
  id: string,
  target: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.distinctDaysPlayed,
    title: `Play on ${target} Days`,
    description: `Complete runs on ${target} distinct UTC days this week.`,
    target,
    progressUnit: neuroPassQuestProgressUnit.count,
    difficultyTag,
    evaluator: (input) => getWeeklyDistinctRunDays(input.ledgerGrants, input.weeklyKey),
  };
}

function createDurationQuest(
  id: string,
  targetMinutes: number,
  difficultyTag: 'easy' | 'med' | 'hard',
): NeuroPassQuestDefinition {
  return {
    id,
    period: neuroPassQuestPeriod.weekly,
    type: neuroPassQuestType.totalDurationMinutes,
    title: `Play ${targetMinutes} Minutes`,
    description: `Accumulate ${targetMinutes} total run minutes this week.`,
    target: targetMinutes,
    progressUnit: neuroPassQuestProgressUnit.points,
    difficultyTag,
    evaluator: (input) => {
      const gainedMinutes = Math.max(1, Math.round(Math.max(0, input.runSummary.durationMs) / 60000));
      return input.state.progress + gainedMinutes;
    },
  };
}

function getWeeklyRunXpTotal(grants: NeuroPassXpGrant[], weeklyKey: string): number {
  return grants.reduce((sum, grant) => {
    if (grant.source !== 'run') {
      return sum;
    }

    const dayKey = grant.meta?.dayKeyUtc ?? utcDayKey(grant.createdAtUtc);
    if (!isDateKeyInWeeklyKey(dayKey, weeklyKey)) {
      return sum;
    }

    return sum + Math.max(0, Math.floor(grant.amount));
  }, 0);
}

function getWeeklyDistinctRunDays(grants: NeuroPassXpGrant[], weeklyKey: string): number {
  const uniqueDays = new Set<string>();

  grants.forEach((grant) => {
    if (grant.source !== 'run') {
      return;
    }

    const dayKey = grant.meta?.dayKeyUtc ?? utcDayKey(grant.createdAtUtc);
    if (!isDateKeyInWeeklyKey(dayKey, weeklyKey)) {
      return;
    }

    uniqueDays.add(dayKey);
  });

  return uniqueDays.size;
}

function hashString(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
