import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';

export interface NeuroPassCatchUpOffer {
  visible: boolean;
  tiersLeft: number;
  message: string;
}

export interface NeuroPassUrgencyState {
  visible: boolean;
  hoursLeft: number;
  ratioToDeadline: number;
  label: string;
}

export interface NeuroPassPostRunUpsellHint {
  visible: boolean;
  tiersUntilMilestone: number;
  milestoneTier: number;
  message: string;
}

export class NeuroPassOfferEngine {
  private upsellShownThisSession = false;

  buildCatchUpOffer(dashboard: NeuroPassDashboard): NeuroPassCatchUpOffer {
    if (dashboard.status !== 'ready' || !dashboard.season) {
      return {
        visible: false,
        tiersLeft: 0,
        message: '',
      };
    }

    if (dashboard.state !== 'active' || dashboard.dayLeft > 5) {
      return {
        visible: false,
        tiersLeft: 0,
        message: '',
      };
    }

    const tiersLeft = Math.max(0, dashboard.season.tiersTotal - dashboard.effectiveTier);
    if (tiersLeft < 3) {
      return {
        visible: false,
        tiersLeft,
        message: '',
      };
    }

    return {
      visible: true,
      tiersLeft,
      message: `You have ${tiersLeft} tiers left. Finish your pass with a catch-up bundle.`,
    };
  }

  buildUrgencyState(dashboard: NeuroPassDashboard): NeuroPassUrgencyState {
    if (dashboard.status !== 'ready' || !dashboard.season || dashboard.state !== 'active') {
      return {
        visible: false,
        hoursLeft: 0,
        ratioToDeadline: 0,
        label: '',
      };
    }

    const hoursLeft = Math.max(0, Math.ceil(dashboard.timeLeftMs / (60 * 60 * 1000)));
    const totalWindowHours = 48;

    if (hoursLeft > totalWindowHours || dashboard.dayLeft > 2) {
      return {
        visible: false,
        hoursLeft,
        ratioToDeadline: 0,
        label: '',
      };
    }

    const ratioToDeadline = Math.max(0, Math.min(1, (totalWindowHours - hoursLeft) / totalWindowHours));

    return {
      visible: true,
      hoursLeft,
      ratioToDeadline,
      label: `Season ends in ${hoursLeft}h`,
    };
  }

  buildPostRunUpsellHint(input: {
    dashboard: NeuroPassDashboard;
    gainedNxp: number;
  }): NeuroPassPostRunUpsellHint {
    const { dashboard, gainedNxp } = input;

    if (dashboard.status !== 'ready' || !dashboard.season) {
      return {
        visible: false,
        tiersUntilMilestone: 0,
        milestoneTier: 0,
        message: '',
      };
    }

    if (gainedNxp <= 0 || dashboard.entitlement.premiumOwned) {
      return {
        visible: false,
        tiersUntilMilestone: 0,
        milestoneTier: 0,
        message: '',
      };
    }

    const currentTier = dashboard.effectiveTier;
    const nextMilestone = dashboard.tiers.find(
      (tier) => tier.isMilestone && tier.tierIndex > currentTier,
    );

    if (!nextMilestone) {
      return {
        visible: false,
        tiersUntilMilestone: 0,
        milestoneTier: 0,
        message: '',
      };
    }

    const tiersUntilMilestone = nextMilestone.tierIndex - currentTier;
    if (tiersUntilMilestone > 2) {
      return {
        visible: false,
        tiersUntilMilestone,
        milestoneTier: nextMilestone.tierIndex,
        message: '',
      };
    }

    return {
      visible: true,
      tiersUntilMilestone,
      milestoneTier: nextMilestone.tierIndex,
      message: 'Premium unlocks the next milestone reward.',
    };
  }

  canShowUpsellSurface(input: {
    nowUtcIso: string;
    lastUpsellAtUtc: string | null;
  }): boolean {
    if (this.upsellShownThisSession) {
      return false;
    }

    if (!input.lastUpsellAtUtc) {
      return true;
    }

    const nowMs = Date.parse(input.nowUtcIso);
    const lastMs = Date.parse(input.lastUpsellAtUtc);

    if (!Number.isFinite(nowMs) || !Number.isFinite(lastMs)) {
      return true;
    }

    const cooldownMs = 4 * 60 * 60 * 1000;
    return nowMs - lastMs >= cooldownMs;
  }

  markUpsellShown(): void {
    this.upsellShownThisSession = true;
  }

  resetSessionForDebug(): void {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      this.upsellShownThisSession = false;
    }
  }
}
