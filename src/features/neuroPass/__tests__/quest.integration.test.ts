import { buildNeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import { ClaimQuestXp } from '@features/neuroPass/domain/usecases/ClaimQuestXp';
import { GrantNeuroPassXpFromRun } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import { UpdateQuestsFromRunSummary } from '@features/neuroPass/domain/usecases/UpdateQuestsFromRunSummary';

import {
  createAnalyticsService,
  InMemoryNeuroPassQuestsRepository,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('Quest flow integration', () => {
  it('run summary -> quest progress -> quest claim -> ledger + tier progression', async () => {
    const repository = new InMemoryNeuroPassRepository();
    repository.progress = {
      currentNxp: 490,
      lastUpdatedAtUtc: '2026-02-21T08:00:00.000Z',
    };

    const questsRepository = new InMemoryNeuroPassQuestsRepository();
    const ledger = new InMemoryXpLedgerRepository();
    const analytics = createAnalyticsService();
    const engine = new NeuroPassQuestEngine();

    questsRepository.state = {
      seasonId: 'neuro_pass_s1',
      dailyKey: '20260221',
      weeklyKey: '20260216',
      daily: [
        questState('d_runs_1', 'daily', '20260221', 1),
        questState('d_accuracy_80', 'daily', '20260221', 1),
        questState('d_combo_18', 'daily', '20260221', 1),
      ],
      weekly: [
        questState('w_runs_10', 'weekly', '20260216', 10),
        questState('w_run_nxp_1800', 'weekly', '20260216', 1800),
        questState('w_boss_3', 'weekly', '20260216', 3),
        questState('w_distinct_days_4', 'weekly', '20260216', 4),
        questState('w_duration_75', 'weekly', '20260216', 75),
      ],
      bossWeekly: questState('boss_weekly', 'bossWeekly', '20260216', 1, 0, 400),
    };

    const grantRunXp = new GrantNeuroPassXpFromRun(
      repository,
      ledger,
      new NeuroPassEconomyPolicy(),
      new NeuroPassAntiAbuseGuard(),
      new TimeSpoofHeuristic(),
      undefined,
      analytics.service,
      () => Date.parse('2026-02-21T10:00:00.000Z'),
    );

    const updateQuests = new UpdateQuestsFromRunSummary(
      questsRepository,
      repository,
      ledger,
      engine,
      new NeuroPassAntiAbuseGuard(),
      analytics.service,
      () => Date.parse('2026-02-21T10:00:00.000Z'),
    );

    const claimQuest = new ClaimQuestXp(
      questsRepository,
      repository,
      ledger,
      engine,
      analytics.service,
      () => Date.parse('2026-02-21T10:10:00.000Z'),
    );

    const runGrant = await grantRunXp.execute({
      runId: 'integration-run-quest-1',
      grade: 'A',
      accuracy: 0.82,
      rhythmBonus: 30,
      comboBonus: 20,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: { invalidInputCount: 5 },
    });

    expect(runGrant.grantedAmount).toBe(200);

    await updateQuests.execute({
      runId: 'integration-run-quest-1',
      endedAtUtc: '2026-02-21T10:00:00.000Z',
      grade: 'A',
      accuracy: 0.82,
      bestCombo: 22,
      avgBeatOffsetMs: 94,
      totalQuestions: 40,
      durationMs: 140000,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      bossCompleted: true,
      antiSpamPenalty: 10,
    });

    const claim = await claimQuest.execute({
      period: 'daily',
      questId: 'd_runs_1',
    });

    expect(claim.grantedAmount).toBe(120);
    expect(claim.isDuplicate).toBe(false);

    const grants = await ledger.listAll();
    expect(grants.some((grant) => grant.id === 'integration-run-quest-1' && grant.source === 'run')).toBe(true);
    expect(grants.some((grant) => grant.id === '20260221:d_runs_1' && grant.source === 'dailyQuest')).toBe(true);

    const progress = buildNeuroPassProgress({
      currentNxp: repository.progress.currentNxp,
      lastUpdatedAtUtc: repository.progress.lastUpdatedAtUtc,
      xpPerTier: 500,
      tiersTotal: 40,
    });

    expect(progress.currentNxp).toBe(810);
    expect(progress.currentTier).toBe(2);
  });
});

function questState(
  questId: string,
  period: 'daily' | 'weekly' | 'bossWeekly',
  periodKey: string,
  target: number,
  progress = 0,
  rewardNxp = period === 'daily' ? 120 : period === 'weekly' ? 320 : 400,
) {
  return {
    questId,
    period,
    periodKey,
    type: 'complete_runs' as const,
    title: questId,
    description: questId,
    progress,
    target,
    progressUnit: 'count' as const,
    rewardNxp,
    status: progress >= target ? ('completed' as const) : ('active' as const),
  };
}
