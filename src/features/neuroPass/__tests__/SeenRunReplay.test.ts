import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import { LocalNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassXpLedgerRepository';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { GrantNeuroPassXpFromRun } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';

import { InMemoryKeyValueStore } from './testUtils';
import { createAnalyticsService, InMemoryNeuroPassRepository } from './xpTestUtils';

describe('Seen run index and replay blocking', () => {
  it('rebuilds seen run ids from existing ledger grants', async () => {
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    await store.appendXpGrant({
      id: 'run_a',
      source: 'run',
      amount: 100,
      createdAtUtc: '2026-02-21T10:00:00.000Z',
    });
    await store.appendXpGrant({
      id: 'quest_a',
      source: 'dailyQuest',
      amount: 120,
      createdAtUtc: '2026-02-21T10:05:00.000Z',
    });

    const ledger = new LocalNeuroPassXpLedgerRepository(
      store,
      () => Date.parse('2026-02-21T12:00:00.000Z'),
      30,
    );

    const rebuiltCount = await ledger.rebuildSeenRunIdsIndex(true);

    expect(rebuiltCount).toBe(1);
    expect(await ledger.hasSeenRunId('run_a')).toBe(true);
    expect(await ledger.hasSeenRunId('quest_a')).toBe(false);
  });

  it('blocks replay immediately via seenRunIds index', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const store = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const ledger = new LocalNeuroPassXpLedgerRepository(
      store,
      () => Date.parse('2026-02-21T12:00:00.000Z'),
      30,
    );
    const analytics = createAnalyticsService();

    const usecase = new GrantNeuroPassXpFromRun(
      repository,
      ledger,
      new NeuroPassEconomyPolicy(),
      new NeuroPassAntiAbuseGuard(),
      new TimeSpoofHeuristic(),
      undefined,
      analytics.service,
      () => Date.parse('2026-02-21T12:00:00.000Z'),
      () => 60_000,
    );

    const first = await usecase.execute({
      runId: 'replay-run-1',
      grade: 'A',
      accuracy: 0.8,
      rhythmBonus: 25,
      comboBonus: 15,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
    });
    const second = await usecase.execute({
      runId: 'replay-run-1',
      grade: 'A',
      accuracy: 0.8,
      rhythmBonus: 25,
      comboBonus: 15,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
    });

    expect(first.grantedAmount).toBeGreaterThan(0);
    expect(second.isDuplicate).toBe(true);
    expect(second.blockedReason).toBe('replay');
    expect(analytics.client.events.some((event) => event.name === 'neuro_pass_replay_blocked')).toBe(true);
  });
});
