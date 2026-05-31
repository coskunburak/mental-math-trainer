import type { NeuroPassApiClient } from '@features/neuroPass/data/api/NeuroPassApiClient';
import type { NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';

export class ApiNeuroPassQuestsRepository implements NeuroPassQuestsRepository {
  constructor(private readonly apiClient: NeuroPassApiClient) {
    void this.apiClient;
  }

  async readQuestState(): Promise<NeuroPassQuestsStateBundle | null> {
    throw notImplemented('ApiNeuroPassQuestsRepository.readQuestState');
  }

  async writeQuestState(_state: NeuroPassQuestsStateBundle): Promise<void> {
    throw notImplemented('ApiNeuroPassQuestsRepository.writeQuestState');
  }
}

function notImplemented(method: string): Error {
  return new Error(`NotImplemented: ${method}`);
}
