import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import type { NeuroPassQuestState } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';
import type { NeuroPassRepository } from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import { getPeriodKeysUtc } from '@features/neuroPass/domain/utils/periodKeys';

export interface NeuroPassQuestsDashboard {
  seasonId: string;
  dailyKey: string;
  weeklyKey: string;
  daily: NeuroPassQuestState[];
  weekly: NeuroPassQuestState[];
  bossWeekly: NeuroPassQuestState | null;
}

export const EMPTY_QUESTS_DASHBOARD: NeuroPassQuestsDashboard = {
  seasonId: 'unknown_season',
  dailyKey: '',
  weeklyKey: '',
  daily: [],
  weekly: [],
  bossWeekly: null,
};

export class LoadQuestsDashboard {
  constructor(
    private readonly questsRepository: NeuroPassQuestsRepository,
    private readonly repository: NeuroPassRepository,
    private readonly questEngine: NeuroPassQuestEngine,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(): Promise<NeuroPassQuestsDashboard> {
    const nowUtc = new Date(this.now());
    const { dailyKey, weeklyKey } = getPeriodKeysUtc(nowUtc);
    const seasonId = (await this.repository.readLastSeenSeasonId()) ?? 'unknown_season';
    const storedState = await this.questsRepository.readQuestState();

    const init = this.questEngine.initOrReset({
      seasonId,
      dailyKey,
      weeklyKey,
      storedState,
    });

    if (init.changed) {
      await this.questsRepository.writeQuestState(init.state);
    }

    return {
      seasonId,
      dailyKey,
      weeklyKey,
      daily: init.state.daily,
      weekly: init.state.weekly,
      bossWeekly: init.state.bossWeekly,
    };
  }
}
