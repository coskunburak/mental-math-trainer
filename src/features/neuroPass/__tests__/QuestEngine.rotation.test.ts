import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';

describe('QuestEngine rotation', () => {
  it('generates deterministic daily rotation for same season/day key', () => {
    const engine = new NeuroPassQuestEngine();

    const first = engine.generateDailyQuests('season_s4', '20260221');
    const second = engine.generateDailyQuests('season_s4', '20260221');

    expect(first.map((quest) => quest.questId)).toEqual(second.map((quest) => quest.questId));
    expect(new Set(first.map((quest) => quest.questId)).size).toBe(3);
    expect(first).toHaveLength(3);
  });

  it('generates deterministic weekly rotation for same season/week key', () => {
    const engine = new NeuroPassQuestEngine();

    const first = engine.generateWeeklyQuests('season_s4', '20260216');
    const second = engine.generateWeeklyQuests('season_s4', '20260216');

    expect(first.map((quest) => quest.questId)).toEqual(second.map((quest) => quest.questId));
    expect(new Set(first.map((quest) => quest.questId)).size).toBe(5);
    expect(first).toHaveLength(5);
  });
});
