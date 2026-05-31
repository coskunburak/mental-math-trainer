import {
  type NeuroPassCapState,
  type NeuroPassRunGrade,
} from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import {
  DEFAULT_NEURO_PASS_CONFIG,
  type NeuroPassConfig,
} from '@features/neuroPass/domain/config/NeuroPassConfig';
import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';
import { clampInt } from '@features/neuroPass/domain/utils/math';

export interface RunNxpBreakdownInput {
  grade: NeuroPassRunGrade;
  rhythmBonus: number;
  comboBonus: number;
  phaseDiversityBonus: number;
  antiSpamPenalty: number;
}

export interface ApplyDailyCapsResult {
  amount: number;
  capState: NeuroPassCapState;
  softCapped: boolean;
  hardCapped: boolean;
}

const GRADE_BASE: Record<NeuroPassRunGrade, number> = {
  C: 90,
  B: 120,
  A: 150,
  S: 180,
};

export class NeuroPassEconomyPolicy {
  constructor(private readonly configProvider?: NeuroPassConfigProvider) {}

  getConfig(): NeuroPassConfig {
    return this.configProvider?.getConfig() ?? DEFAULT_NEURO_PASS_CONFIG;
  }

  gradeBase(grade: NeuroPassRunGrade): number {
    return GRADE_BASE[grade] ?? GRADE_BASE.C;
  }

  computeRunBaseNxp(input: RunNxpBreakdownInput): number {
    const config = this.getConfig();
    const weightedRhythm = clampInt(
      Math.round(clampInt(input.rhythmBonus, 0, 40) * config.rhythmBonusWeight),
      0,
      80,
    );
    const weightedCombo = clampInt(
      Math.round(clampInt(input.comboBonus, 0, 25) * config.comboBonusWeight),
      0,
      50,
    );
    const scaledAntiSpam = clampInt(
      Math.round(clampInt(input.antiSpamPenalty, 0, 60) * config.antiSpamScale),
      0,
      120,
    );

    const total =
      this.gradeBase(input.grade)
      + weightedRhythm
      + weightedCombo
      + clampInt(input.phaseDiversityBonus, 0, 10)
      - scaledAntiSpam;

    return clampInt(total, 60, 260);
  }

  computePhaseDiversityBonus(input: {
    accuracy: number;
    playedAllFourPhases: boolean;
  }): number {
    if (input.playedAllFourPhases && input.accuracy >= 0.75) {
      return 10;
    }

    return 0;
  }

  applyDailyCaps(todayRunTotal: number, nxpPreCap: number): ApplyDailyCapsResult {
    const config = this.getConfig();
    const runTotal = Math.max(0, Math.floor(todayRunTotal));
    const preCap = Math.max(0, Math.floor(nxpPreCap));

    if (runTotal >= config.hardCapThreshold) {
      return {
        amount: 0,
        capState: 'hard',
        softCapped: false,
        hardCapped: true,
      };
    }

    if (runTotal >= config.softCapThreshold) {
      return {
        amount: Math.max(0, Math.round(preCap * config.softCapMultiplier)),
        capState: 'soft',
        softCapped: true,
        hardCapped: false,
      };
    }

    return {
      amount: preCap,
      capState: 'none',
      softCapped: false,
      hardCapped: false,
    };
  }
}
