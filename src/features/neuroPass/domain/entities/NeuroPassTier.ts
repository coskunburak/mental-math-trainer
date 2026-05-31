import type { NeuroPassReward } from './NeuroPassReward';

export interface NeuroPassTier {
  tierIndex: number;
  freeReward: NeuroPassReward;
  premiumReward: NeuroPassReward;
  isMilestone: boolean;
  isUnlockedByProgress: boolean;
}
