import { ClaimDailyQuestXp } from '@features/neuroPass/domain/usecases/ClaimDailyQuestXp';
import { LoadDailyQuestsForToday } from '@features/neuroPass/domain/usecases/LoadDailyQuestsForToday';

import {
  createAnalyticsService,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('Daily quest NXP', () => {
  it('grants +120 once per quest/day and marks quest claimed', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const ledger = new InMemoryXpLedgerRepository();
    const analytics = createAnalyticsService();

    const nowMs = Date.parse('2026-02-21T08:00:00.000Z');

    const claimQuest = new ClaimDailyQuestXp(
      repository,
      ledger,
      analytics.service,
      () => nowMs,
    );

    const loadDailyQuests = new LoadDailyQuestsForToday(ledger, () => nowMs);

    const before = await loadDailyQuests.execute();
    expect(before).toHaveLength(3);
    expect(before.every((quest) => quest.state === 'available')).toBe(true);

    const first = await claimQuest.execute('fusion_run_1');
    const second = await claimQuest.execute('fusion_run_1');

    expect(first.grantedAmount).toBe(120);
    expect(first.isDuplicate).toBe(false);
    expect(second.grantedAmount).toBe(0);
    expect(second.isDuplicate).toBe(true);

    const after = await loadDailyQuests.execute();
    const claimedQuest = after.find((quest) => quest.id === 'fusion_run_1');
    const availableCount = after.filter((quest) => quest.state === 'available').length;

    expect(claimedQuest?.state).toBe('claimed');
    expect(availableCount).toBe(2);
    expect(repository.progress.currentNxp).toBe(120);
  });
});
