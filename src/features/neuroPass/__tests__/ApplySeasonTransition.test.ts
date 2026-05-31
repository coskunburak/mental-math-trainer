import { ApplySeasonTransition } from '@features/neuroPass/domain/usecases/ApplySeasonTransition';

describe('ApplySeasonTransition', () => {
  it('resets progress and entitlement when season changes', () => {
    const usecase = new ApplySeasonTransition();

    const result = usecase.execute({
      seasonId: 'season_2',
      seasonState: 'active',
      progress: {
        currentNxp: 2400,
        lastUpdatedAtUtc: '2026-02-02T00:00:00.000Z',
      },
      entitlement: {
        premiumOwned: true,
        plusTierSkipsRemaining: 5,
      },
      lastSeenSeasonId: 'season_1',
      lastAppliedSeasonState: 'active',
      nowUtcIso: '2026-03-01T00:00:00.000Z',
    });

    expect(result.seasonChanged).toBe(true);
    expect(result.progress.currentNxp).toBe(0);
    expect(result.entitlement.premiumOwned).toBe(false);
    expect(result.entitlement.plusTierSkipsRemaining).toBe(0);
    expect(result.shouldResetClaimPlaceholder).toBe(true);
  });

  it('keeps progress when season does not change', () => {
    const usecase = new ApplySeasonTransition();

    const result = usecase.execute({
      seasonId: 'season_1',
      seasonState: 'grace',
      progress: {
        currentNxp: 1800,
        lastUpdatedAtUtc: '2026-02-20T00:00:00.000Z',
      },
      entitlement: {
        premiumOwned: false,
        plusTierSkipsRemaining: 0,
      },
      lastSeenSeasonId: 'season_1',
      lastAppliedSeasonState: 'active',
      nowUtcIso: '2026-03-02T00:00:00.000Z',
    });

    expect(result.seasonChanged).toBe(false);
    expect(result.stateChanged).toBe(true);
    expect(result.progress.currentNxp).toBe(1800);
    expect(result.entitlement.premiumOwned).toBe(false);
    expect(result.shouldResetClaimPlaceholder).toBe(false);
  });
});
