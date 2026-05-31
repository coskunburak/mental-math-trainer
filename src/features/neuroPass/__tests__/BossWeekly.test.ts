import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { ClaimQuestXp } from '@features/neuroPass/domain/usecases/ClaimQuestXp';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import { UpdateQuestsFromRunSummary } from '@features/neuroPass/domain/usecases/UpdateQuestsFromRunSummary';

import {
  createAnalyticsService,
  InMemoryNeuroPassQuestsRepository,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('Boss weekly quest', () => {
  it('completes from boss run signal and can be claimed only once per week', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const questsRepository = new InMemoryNeuroPassQuestsRepository();
    const ledger = new InMemoryXpLedgerRepository();
    const analytics = createAnalyticsService();
    const engine = new NeuroPassQuestEngine();

    questsRepository.state = {
      seasonId: 'neuro_pass_s1',
      dailyKey: '20260221',
      weeklyKey: '20260216',
      daily: engine.generateDailyQuests('neuro_pass_s1', '20260221'),
      weekly: engine.generateWeeklyQuests('neuro_pass_s1', '20260216'),
      bossWeekly: engine.generateBossWeeklyQuest('20260216'),
    };

    const update = new UpdateQuestsFromRunSummary(
      questsRepository,
      repository,
      ledger,
      engine,
      new NeuroPassAntiAbuseGuard(),
      analytics.service,
      () => Date.parse('2026-02-21T11:00:00.000Z'),
    );

    await update.execute({
      runId: 'boss-weekly-run-1',
      endedAtUtc: '2026-02-21T11:00:00.000Z',
      grade: 'B',
      accuracy: 0.79,
      bestCombo: 19,
      avgBeatOffsetMs: 115,
      totalQuestions: 36,
      durationMs: 150000,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      bossCompleted: true,
      antiSpamPenalty: 7,
    });

    const storedAfterUpdate = await questsRepository.readQuestState();
    expect(storedAfterUpdate?.bossWeekly?.status).toBe('completed');

    const claim = new ClaimQuestXp(
      questsRepository,
      repository,
      ledger,
      engine,
      analytics.service,
      () => Date.parse('2026-02-21T12:00:00.000Z'),
    );

    const first = await claim.execute({
      period: 'bossWeekly',
      questId: 'boss_weekly',
    });

    const second = await claim.execute({
      period: 'bossWeekly',
      questId: 'boss_weekly',
    });

    expect(first.grantedAmount).toBe(400);
    expect(first.isDuplicate).toBe(false);
    expect(second.isDuplicate).toBe(true);
    expect(repository.progress.currentNxp).toBe(400);
  });
});
