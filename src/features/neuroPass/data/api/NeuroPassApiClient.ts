import type { ClaimRequest } from '@features/neuroPass/domain/dto/ClaimRequest';
import type { ProgressResponse } from '@features/neuroPass/domain/dto/ProgressResponse';
import type { XpGrantRequest } from '@features/neuroPass/domain/dto/XpGrantRequest';
import type { NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';

export interface NeuroPassApiClient {
  fetchProgress(seasonId: string): Promise<ProgressResponse>;
  grantXp(request: XpGrantRequest): Promise<ProgressResponse>;
  submitClaim(request: ClaimRequest): Promise<void>;
  fetchQuests(seasonId: string): Promise<NeuroPassQuestsStateBundle | null>;
  updateQuests(state: NeuroPassQuestsStateBundle): Promise<void>;
}

export class StubNeuroPassApiClient implements NeuroPassApiClient {
  async fetchProgress(_seasonId: string): Promise<ProgressResponse> {
    throw new Error('NotImplemented: NeuroPassApiClient.fetchProgress');
  }

  async grantXp(_request: XpGrantRequest): Promise<ProgressResponse> {
    throw new Error('NotImplemented: NeuroPassApiClient.grantXp');
  }

  async submitClaim(_request: ClaimRequest): Promise<void> {
    throw new Error('NotImplemented: NeuroPassApiClient.submitClaim');
  }

  async fetchQuests(_seasonId: string): Promise<NeuroPassQuestsStateBundle | null> {
    throw new Error('NotImplemented: NeuroPassApiClient.fetchQuests');
  }

  async updateQuests(_state: NeuroPassQuestsStateBundle): Promise<void> {
    throw new Error('NotImplemented: NeuroPassApiClient.updateQuests');
  }
}
