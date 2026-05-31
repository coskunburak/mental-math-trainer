import { ClaimQuestXp } from '@features/neuroPass/domain/usecases/ClaimQuestXp';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import { neuroPassQuestStatus } from '@features/neuroPass/domain/quests/QuestTypes';

import {
  createAnalyticsService,
  InMemoryNeuroPassQuestsRepository,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('Quest claim idempotency', () => {
  it('blocks claim before completion and makes second claim a no-op', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const questsRepository = new InMemoryNeuroPassQuestsRepository();
    const ledger = new InMemoryXpLedgerRepository();
    const analytics = createAnalyticsService();
    const engine = new NeuroPassQuestEngine();

    const daily = engine.generateDailyQuests('neuro_pass_s1', '20260221');
    const weekly = engine.generateWeeklyQuests('neuro_pass_s1', '20260216');
    const bossWeekly = engine.generateBossWeeklyQuest('20260216');

    const completedDailyQuest = {
      ...daily[0],
      progress: daily[0]?.target ?? 1,
      status: neuroPassQuestStatus.completed,
      completedAtUtc: '2026-02-21T09:00:00.000Z',
    };

    questsRepository.state = {
      seasonId: 'neuro_pass_s1',
      dailyKey: '20260221',
      weeklyKey: '20260216',
      daily: [
        completedDailyQuest,
        ...(daily.slice(1)),
      ],
      weekly,
      bossWeekly,
    };

    const usecase = new ClaimQuestXp(
      questsRepository,
      repository,
      ledger,
      engine,
      analytics.service,
      () => Date.parse('2026-02-21T10:00:00.000Z'),
    );

    const activeQuest = daily[1];
    const blocked = await usecase.execute({
      period: 'daily',
      questId: activeQuest?.questId,
    });

    expect(blocked.blocked).toBe(true);
    expect(blocked.reason).toBe('not_completed');

    const first = await usecase.execute({
      period: 'daily',
      questId: completedDailyQuest.questId,
    });
    const second = await usecase.execute({
      period: 'daily',
      questId: completedDailyQuest.questId,
    });

    expect(first.grantedAmount).toBe(120);
    expect(first.isDuplicate).toBe(false);
    expect(second.isDuplicate).toBe(true);
    expect(second.reason).toBe('already_claimed');

    const grants = await ledger.listAll();
    expect(grants).toHaveLength(1);
    expect(grants[0]?.id).toBe(`20260221:${completedDailyQuest.questId}`);
    expect(repository.progress.currentNxp).toBe(120);
  });
});
