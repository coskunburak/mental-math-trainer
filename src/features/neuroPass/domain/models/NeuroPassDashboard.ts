import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import type { NeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';
import type { NeuroPassSeason } from '@features/neuroPass/domain/entities/NeuroPassSeason';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

export interface NeuroPassDashboard {
  status: 'ready' | 'unavailable';
  season: NeuroPassSeason | null;
  tiers: NeuroPassTier[];
  progress: NeuroPassProgress;
  effectiveTier: number;
  bonusUnlockedTiers: number;
  tierSkipsBalance: number;
  entitlement: NeuroPassEntitlement;
  timeLeftMs: number;
  dayLeft: number;
  state: NeuroPassSeasonState;
  unavailableReason?: string;
}
