import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';

export interface ProgressResponse {
  currentNxp: number;
  tier: number;
  entitlement: NeuroPassEntitlement;
  questState: NeuroPassQuestsStateBundle | null;
}
