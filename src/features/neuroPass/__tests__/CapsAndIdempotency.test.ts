import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import { GrantNeuroPassXpFromRun } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import { ClaimDailyQuestXp } from '@features/neuroPass/domain/usecases/ClaimDailyQuestXp';

import {
  createAnalyticsService,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('Daily cap thresholds', () => {
  const policy = new NeuroPassEconomyPolicy();

  it('applies no cap below 900, soft cap from 900 to 1199, and hard cap from 1200', () => {
    expect(policy.applyDailyCaps(899, 200)).toEqual({
      amount: 200,
      capState: 'none',
      softCapped: false,
      hardCapped: false,
    });

    expect(policy.applyDailyCaps(900, 200)).toEqual({
      amount: Math.round(200 * 0.35),
      capState: 'soft',
      softCapped: true,
      hardCapped: false,
    });

    expect(policy.applyDailyCaps(1199, 200)).toEqual({
      amount: Math.round(200 * 0.35),
      capState: 'soft',
      softCapped: true,
      hardCapped: false,
    });

    expect(policy.applyDailyCaps(1200, 200)).toEqual({
      amount: 0,
      capState: 'hard',
      softCapped: false,
      hardCapped: true,
    });
  });
});

describe('Idempotency and hard-cap ledger behavior', () => {
  it('stores a 0-amount hard-cap run grant and treats same runId as duplicate later', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const ledger = new InMemoryXpLedgerRepository();
    const analytics = createAnalyticsService();

    ledger.seed([
      {
        id: 'today-seed',
        source: 'run',
        amount: 1200,
        createdAtUtc: '2026-02-21T01:00:00.000Z',
      },
    ]);

    const usecase = new GrantNeuroPassXpFromRun(
      repository,
      ledger,
      new NeuroPassEconomyPolicy(),
      new NeuroPassAntiAbuseGuard(),
      new TimeSpoofHeuristic(),
      undefined,
      analytics.service,
      () => Date.parse('2026-02-21T12:00:00.000Z'),
    );

    const first = await usecase.execute({
      runId: 'hard-cap-run',
      grade: 'S',
      accuracy: 0.9,
      rhythmBonus: 40,
      comboBonus: 25,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: {},
    });

    const second = await usecase.execute({
      runId: 'hard-cap-run',
      grade: 'S',
      accuracy: 0.9,
      rhythmBonus: 40,
      comboBonus: 25,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: {},
    });

    expect(first.isDuplicate).toBe(false);
    expect(first.grantedAmount).toBe(0);
    expect(first.capState).toBe('hard');

    expect(second.isDuplicate).toBe(true);
    expect(second.grantedAmount).toBe(0);

    const grants = await ledger.listAll();
    const hardCapGrant = grants.find((grant) => grant.id === 'hard-cap-run');

    expect(hardCapGrant?.amount).toBe(0);
    expect(hardCapGrant?.meta?.capState).toBe('hard');
  });

  it('prevents claiming the same daily quest twice on the same UTC day', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const ledger = new InMemoryXpLedgerRepository();
    const analytics = createAnalyticsService();

    const usecase = new ClaimDailyQuestXp(
      repository,
      ledger,
      analytics.service,
      () => Date.parse('2026-02-21T09:00:00.000Z'),
    );

    const first = await usecase.execute('boss_clear_1');
    const second = await usecase.execute('boss_clear_1');

    expect(first.isDuplicate).toBe(false);
    expect(first.grantedAmount).toBe(120);
    expect(second.isDuplicate).toBe(true);
    expect(second.grantedAmount).toBe(0);
  });
});
