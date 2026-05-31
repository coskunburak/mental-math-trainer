import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassQuestState, NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';

export class LocalNeuroPassQuestsRepository implements NeuroPassQuestsRepository {
  constructor(private readonly localStore: NeuroPassLocalStore) {}

  async readQuestState(): Promise<NeuroPassQuestsStateBundle | null> {
    return this.localStore.getQuestState();
  }

  async writeQuestState(state: NeuroPassQuestsStateBundle): Promise<void> {
    await this.localStore.setQuestState(state);
  }

  async readDailyAndWeekly(): Promise<{
    daily: NeuroPassQuestState[];
    weekly: NeuroPassQuestState[];
    bossWeekly: NeuroPassQuestState | null;
  }> {
    const state = await this.localStore.getQuestState();
    return {
      daily: state?.daily ?? [],
      weekly: state?.weekly ?? [],
      bossWeekly: state?.bossWeekly ?? null,
    };
  }
}
