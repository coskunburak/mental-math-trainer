import { GrantNeuroPassXpFromRun } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { NeuroPassAntiAbuseGuard } from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import { buildNeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';

import {
  createAnalyticsService,
  InMemoryNeuroPassRepository,
  InMemoryXpLedgerRepository,
} from './xpTestUtils';

describe('Neuro Pass run integration', () => {
  it('appends ledger grant, updates progress, and increases tier when threshold is crossed', async () => {
    const repository = new InMemoryNeuroPassRepository();
    repository.progress = {
      currentNxp: 490,
      lastUpdatedAtUtc: '2026-02-20T22:00:00.000Z',
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
      runId: 'integration-run-01',
      grade: 'A',
      accuracy: 0.82,
      rhythmBonus: 30,
      comboBonus: 20,
      phasesPlayed: ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'],
      antiSpamSignals: {
        invalidInputCount: 5,
      },
    });

    expect(result.grantedAmount).toBe(200);
    expect(result.tierBefore).toBe(1);
    expect(result.tierAfter).toBe(2);

    const grants = await ledger.listAll();
    expect(grants).toHaveLength(1);
    expect(grants[0]?.id).toBe('integration-run-01');
    expect(grants[0]?.amount).toBe(200);

    const computedProgress = buildNeuroPassProgress({
      currentNxp: repository.progress.currentNxp,
      lastUpdatedAtUtc: repository.progress.lastUpdatedAtUtc,
      xpPerTier: 500,
      tiersTotal: 40,
    });

    expect(computedProgress.currentNxp).toBe(690);
    expect(computedProgress.currentTier).toBe(2);
    expect(computedProgress.tierProgressPct).toBeCloseTo(0.38, 2);
  });
});
