import { GrantNeuroPassXpFromRun } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';

import {
  createAnalyticsService,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('GrantNeuroPassXpFromRun', () => {
  it('grants run NXP from formula and updates progress/tier', async () => {
    const repository = new InMemoryNeuroPassRepository();
    repository.progress = {
      currentNxp: 480,
      lastUpdatedAtUtc: '2026-02-21T00:00:00.000Z',
    };

    const ledger = new InMemoryXpLedgerRepository();
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
    );

    const result = await usecase.execute({
      runId: 'run-001',
      grade: 'A',
      accuracy: 0.82,
      rhythmBonus: 30,
      comboBonus: 20,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: {
        invalidInputCount: 5,
      },
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.grantedAmount).toBe(200);
    expect(result.capState).toBe('none');
    expect(result.tierBefore).toBe(1);
    expect(result.tierAfter).toBe(2);

    expect(repository.progress.currentNxp).toBe(680);

    const grants = await ledger.listAll();
    expect(grants).toHaveLength(1);
    expect(grants[0]?.id).toBe('run-001');
    expect(grants[0]?.amount).toBe(200);
    expect(grants[0]?.source).toBe('run');

    expect(analytics.client.events.some((event) => event.name === 'neuro_pass_xp_granted')).toBe(true);
    expect(analytics.client.events.some((event) => event.name === 'neuro_pass_tier_reached')).toBe(true);
  });

  it('is idempotent for duplicate runId', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const ledger = new InMemoryXpLedgerRepository();
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
    );

    const first = await usecase.execute({
      runId: 'run-idempotent',
      grade: 'B',
      accuracy: 0.8,
      rhythmBonus: 20,
      comboBonus: 10,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: {},
    });

    const second = await usecase.execute({
      runId: 'run-idempotent',
      grade: 'S',
      accuracy: 1,
      rhythmBonus: 40,
      comboBonus: 25,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: {},
    });

    expect(first.isDuplicate).toBe(false);
    expect(second.isDuplicate).toBe(true);
    expect(second.grantedAmount).toBe(0);

    const grants = await ledger.listAll();
    expect(grants).toHaveLength(1);
  });

  it('rejects empty runId and does not append a grant', async () => {
    const repository = new InMemoryNeuroPassRepository();
    const ledger = new InMemoryXpLedgerRepository();
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
    );

    const result = await usecase.execute({
      runId: '  ',
      grade: 'A',
      accuracy: 0.9,
      rhythmBonus: 20,
      comboBonus: 20,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
    });

    expect(result.grantedAmount).toBe(0);
    expect(result.isDuplicate).toBe(true);
    expect(result.blockedReason).toBe('invalid_run_id');
    expect((await ledger.listAll()).length).toBe(0);
  });
});
