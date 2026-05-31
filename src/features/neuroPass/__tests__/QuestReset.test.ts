import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';

describe('Quest reset behavior', () => {
  it('resets daily quests when day key changes and weekly quests when week key changes', () => {
    const engine = new NeuroPassQuestEngine();

    const initial = engine.initOrReset({
      seasonId: 'season_s4',
      dailyKey: '20260221',
      weeklyKey: '20260216',
      storedState: null,
    });

    expect(initial.didResetDaily).toBe(true);
    expect(initial.didResetWeekly).toBe(true);

    const samePeriod = engine.initOrReset({
      seasonId: 'season_s4',
      dailyKey: '20260221',
      weeklyKey: '20260216',
      storedState: initial.state,
    });

    expect(samePeriod.didResetDaily).toBe(false);
    expect(samePeriod.didResetWeekly).toBe(false);

    const nextDay = engine.initOrReset({
      seasonId: 'season_s4',
      dailyKey: '20260222',
      weeklyKey: '20260216',
      storedState: samePeriod.state,
    });

    expect(nextDay.didResetDaily).toBe(true);
    expect(nextDay.didResetWeekly).toBe(false);

    const nextWeek = engine.initOrReset({
      seasonId: 'season_s4',
      dailyKey: '20260224',
      weeklyKey: '20260223',
      storedState: nextDay.state,
    });

    expect(nextWeek.didResetDaily).toBe(true);
    expect(nextWeek.didResetWeekly).toBe(true);
  });
});
