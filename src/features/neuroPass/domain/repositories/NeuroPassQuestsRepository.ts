import type { NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';

export interface NeuroPassQuestsRepository {
  readQuestState(): Promise<NeuroPassQuestsStateBundle | null>;
  writeQuestState(state: NeuroPassQuestsStateBundle): Promise<void>;
}
