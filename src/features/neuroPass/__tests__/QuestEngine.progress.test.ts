import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import type { NeuroPassQuestState, NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import { neuroPassQuestPeriod, neuroPassQuestStatus } from '@features/neuroPass/domain/quests/QuestTypes';

describe('QuestEngine progress updates', () => {
  it('progresses and completes quests from run summary signals, including boss weekly', () => {
    const engine = new NeuroPassQuestEngine();

    const state: NeuroPassQuestsStateBundle = {
      seasonId: 'season_s4',
      dailyKey: '20260221',
      weeklyKey: '20260216',
      daily: [
        questState('d_runs_1', neuroPassQuestPeriod.daily, '20260221', 1),
        questState('d_accuracy_80', neuroPassQuestPeriod.daily, '20260221', 1),
        questState('d_combo_18', neuroPassQuestPeriod.daily, '20260221', 1),
      ],
      weekly: [
        questState('w_runs_10', neuroPassQuestPeriod.weekly, '20260216', 10, 9),
        questState('w_run_nxp_1800', neuroPassQuestPeriod.weekly, '20260216', 1800),
        questState('w_boss_3', neuroPassQuestPeriod.weekly, '20260216', 3, 2),
        questState('w_distinct_days_4', neuroPassQuestPeriod.weekly, '20260216', 4),
        questState('w_duration_75', neuroPassQuestPeriod.weekly, '20260216', 75, 40),
      ],
      bossWeekly: questState('boss_weekly', neuroPassQuestPeriod.bossWeekly, '20260216', 1),
    };

    const applied = engine.applyRunSummaryToQuests({
      state,
      runSummary: {
        runId: 'run_quest_progress_1',
        endedAtUtc: '2026-02-21T10:00:00.000Z',
        grade: 'A',
        accuracy: 0.91,
        bestCombo: 27,
        avgBeatOffsetMs: 84,
        totalQuestions: 42,
        durationMs: 180000,
        phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
        antiSpamPenalty: 8,
        bossCompleted: true,
      },
      ledgerGrants: [
        {
          id: 'seed_run_1',
          source: 'run',
          amount: 970,
          createdAtUtc: '2026-02-18T09:00:00.000Z',
          meta: { dayKeyUtc: '20260218' },
        },
        {
          id: 'seed_run_2',
          source: 'run',
          amount: 960,
          createdAtUtc: '2026-02-21T09:30:00.000Z',
          meta: { dayKeyUtc: '20260221' },
        },
      ],
    });

    const dailyRunQuest = applied.state.daily.find((quest) => quest.questId === 'd_runs_1');
    const dailyAccuracyQuest = applied.state.daily.find((quest) => quest.questId === 'd_accuracy_80');
    const weeklyRunsQuest = applied.state.weekly.find((quest) => quest.questId === 'w_runs_10');
    const weeklyRunXpQuest = applied.state.weekly.find((quest) => quest.questId === 'w_run_nxp_1800');

    expect(applied.changed).toBe(true);
    expect(dailyRunQuest?.status).toBe(neuroPassQuestStatus.completed);
    expect(dailyAccuracyQuest?.status).toBe(neuroPassQuestStatus.completed);
    expect(weeklyRunsQuest?.status).toBe(neuroPassQuestStatus.completed);
    expect(weeklyRunXpQuest?.progress).toBe(1800);
    expect(weeklyRunXpQuest?.status).toBe(neuroPassQuestStatus.completed);
    expect(applied.state.bossWeekly?.status).toBe(neuroPassQuestStatus.completed);
  });
});

function questState(
  questId: string,
  period: 'daily' | 'weekly' | 'bossWeekly',
  periodKey: string,
  target: number,
  progress = 0,
): NeuroPassQuestState {
  return {
    questId,
    period,
    periodKey,
    type: 'complete_runs',
    title: questId,
    description: questId,
    progress,
    target,
    progressUnit: 'count',
    rewardNxp: period === 'daily' ? 120 : period === 'weekly' ? 320 : 400,
    status: progress >= target ? 'completed' : 'active',
  };
}
