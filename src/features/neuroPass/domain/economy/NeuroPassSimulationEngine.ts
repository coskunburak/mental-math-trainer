import type { NeuroPassRunGrade } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { clampInt, clampNumber } from '@features/neuroPass/domain/utils/math';

export type NeuroPassPlayerProfile = 'P50' | 'P75' | 'P90';

export interface GradeDistribution {
  C: number;
  B: number;
  A: number;
  S: number;
}

export interface NeuroPassSimulationInput {
  seed: number;
  profile: NeuroPassPlayerProfile;
  sessionsPerDay: number;
  daysActivePerWeek: number;
  gradeDistribution: GradeDistribution;
  rhythmBonusMean: number;
  rhythmBonusStd: number;
  comboBonusMean: number;
  comboBonusStd: number;
  phaseDiversityRate: number;
  antiSpamPenaltyMean: number;
  antiSpamPenaltyStd: number;
}

export interface HistogramBucket {
  minInclusive: number;
  maxInclusive: number;
  count: number;
}

export interface RunNxpDistributionReport {
  samples: number;
  histogram: HistogramBucket[];
  averageRunNxpPreCap: number;
  averageRunNxpAfterCap: number;
  averageLostToCap: number;
}

export interface CapCurvePoint {
  todayRunTotal: number;
  effectiveForCandidateRun: number;
  lostForCandidateRun: number;
}

export interface CapCurveReport {
  candidateRunNxp: number;
  points: CapCurvePoint[];
}

export interface SeasonProjectionReport {
  totalNxp: number;
  tiersReached: number;
  completionDayEstimateP75: number | null;
  completionDayEstimateP90: number | null;
  dailyQuestNxp: number;
  weeklyQuestNxp: number;
  runNxp: number;
}

export interface NeuroPassSimulationReport {
  runDistribution: RunNxpDistributionReport;
  capCurve: CapCurveReport;
  seasonProjection: SeasonProjectionReport;
  assumptions: {
    profileMultiplier: number;
    activeDayRate: number;
  };
}

const HISTOGRAM_BIN = 20;
const HISTOGRAM_MIN = 60;
const HISTOGRAM_MAX = 260;
const SEASON_DAYS = 28;

const PROFILE_MULTIPLIER: Record<NeuroPassPlayerProfile, number> = {
  P50: 1,
  P75: 1.12,
  P90: 1.24,
};

const DEFAULT_QUESTS_DAILY_NXP = 3 * 120;
const DEFAULT_QUESTS_WEEKLY_NXP = 5 * 320;
const DEFAULT_BOSS_WEEKLY_NXP = 400;

export class NeuroPassSimulationEngine {
  constructor(private readonly economyPolicy: NeuroPassEconomyPolicy) {}

  run(input: NeuroPassSimulationInput): NeuroPassSimulationReport {
    const normalized = normalizeInput(input);
    const runDistribution = this.buildRunDistribution(normalized);
    const capCurve = this.buildCapCurve(runDistribution.averageRunNxpPreCap);
    const seasonProjection = this.simulateSeason(normalized);

    return {
      runDistribution,
      capCurve,
      seasonProjection,
      assumptions: {
        profileMultiplier: PROFILE_MULTIPLIER[normalized.profile],
        activeDayRate: normalized.daysActivePerWeek / 7,
      },
    };
  }

  private buildRunDistribution(input: NeuroPassSimulationInput): RunNxpDistributionReport {
    const random = createSeededRandom(input.seed ^ 0x2f9e3779);
    const samples = 700;
    const histogram = createHistogramBuckets();

    let preCapTotal = 0;
    let postCapTotal = 0;

    for (let index = 0; index < samples; index += 1) {
      const runPreCap = this.sampleRunNxpPreCap(input, random);
      const todayRunTotal = Math.floor((index % 22) * (runPreCap * 0.85));
      const capped = this.economyPolicy.applyDailyCaps(todayRunTotal, runPreCap);

      preCapTotal += runPreCap;
      postCapTotal += capped.amount;
      updateHistogram(histogram, capped.amount);
    }

    const averageRunNxpPreCap = round2(preCapTotal / samples);
    const averageRunNxpAfterCap = round2(postCapTotal / samples);

    return {
      samples,
      histogram,
      averageRunNxpPreCap,
      averageRunNxpAfterCap,
      averageLostToCap: round2(averageRunNxpPreCap - averageRunNxpAfterCap),
    };
  }

  private buildCapCurve(candidateRunNxp: number): CapCurveReport {
    const points: CapCurvePoint[] = [];
    const candidate = clampInt(Math.round(candidateRunNxp), 60, 260);

    for (let todayRunTotal = 0; todayRunTotal <= 1600; todayRunTotal += 100) {
      const capped = this.economyPolicy.applyDailyCaps(todayRunTotal, candidate);
      points.push({
        todayRunTotal,
        effectiveForCandidateRun: capped.amount,
        lostForCandidateRun: Math.max(0, candidate - capped.amount),
      });
    }

    return {
      candidateRunNxp: candidate,
      points,
    };
  }

  private simulateSeason(input: NeuroPassSimulationInput): SeasonProjectionReport {
    const random = createSeededRandom(input.seed ^ 0x6d2b79f5);

    let totalNxp = 0;
    let dailyQuestNxp = 0;
    let weeklyQuestNxp = 0;
    let runNxp = 0;
    let completionDayP75: number | null = null;
    let completionDayP90: number | null = null;

    for (let day = 1; day <= SEASON_DAYS; day += 1) {
      const weekday = (day - 1) % 7;
      const isActiveDay = weekday < input.daysActivePerWeek;

      let todayRunTotal = 0;
      if (isActiveDay) {
        for (let session = 0; session < input.sessionsPerDay; session += 1) {
          const runPreCap = this.sampleRunNxpPreCap(input, random);
          const capped = this.economyPolicy.applyDailyCaps(todayRunTotal, runPreCap);
          todayRunTotal += capped.amount;
          runNxp += capped.amount;
          totalNxp += capped.amount;
        }

        dailyQuestNxp += DEFAULT_QUESTS_DAILY_NXP;
        totalNxp += DEFAULT_QUESTS_DAILY_NXP;
      }

      if (day % 7 === 0) {
        const activeDaysThisWeek = Math.min(input.daysActivePerWeek, 7);
        const weeklyCompletionRate = clampNumber(activeDaysThisWeek / 5, 0, 1);
        const weeklyClaims = Math.round(5 * weeklyCompletionRate);
        const weeklyTotal = weeklyClaims * 320 + (activeDaysThisWeek >= 2 ? DEFAULT_BOSS_WEEKLY_NXP : 0);

        weeklyQuestNxp += weeklyTotal;
        totalNxp += weeklyTotal;
      }

      if (completionDayP75 == null && totalNxp * 1.12 >= 20000) {
        completionDayP75 = day;
      }

      if (completionDayP90 == null && totalNxp * 1.24 >= 20000) {
        completionDayP90 = day;
      }
    }

    const tiersReached = Math.min(40, Math.floor(totalNxp / 500));

    return {
      totalNxp: Math.max(0, Math.round(totalNxp)),
      tiersReached,
      completionDayEstimateP75: completionDayP75,
      completionDayEstimateP90: completionDayP90,
      dailyQuestNxp: Math.round(dailyQuestNxp),
      weeklyQuestNxp: Math.round(weeklyQuestNxp),
      runNxp: Math.round(runNxp),
    };
  }

  private sampleRunNxpPreCap(input: NeuroPassSimulationInput, random: () => number): number {
    const grade = sampleGrade(input.gradeDistribution, random);
    const rhythmBonus = clampInt(
      Math.round(sampleNormal(random, input.rhythmBonusMean, input.rhythmBonusStd)),
      0,
      40,
    );
    const comboBonus = clampInt(
      Math.round(sampleNormal(random, input.comboBonusMean, input.comboBonusStd)),
      0,
      25,
    );
    const antiSpamPenalty = clampInt(
      Math.round(sampleNormal(random, input.antiSpamPenaltyMean, input.antiSpamPenaltyStd)),
      0,
      60,
    );
    const phaseDiversityBonus = random() < input.phaseDiversityRate
      ? this.economyPolicy.computePhaseDiversityBonus({
        accuracy: 0.8,
        playedAllFourPhases: true,
      })
      : 0;

    const preCap = this.economyPolicy.computeRunBaseNxp({
      grade,
      rhythmBonus,
      comboBonus,
      phaseDiversityBonus,
      antiSpamPenalty,
    });

    const profileAdjusted = Math.round(preCap * PROFILE_MULTIPLIER[input.profile]);
    return clampInt(profileAdjusted, 60, 260);
  }
}

function normalizeInput(input: NeuroPassSimulationInput): NeuroPassSimulationInput {
  return {
    seed: Math.max(1, Math.floor(input.seed || 1)),
    profile: input.profile,
    sessionsPerDay: clampInt(input.sessionsPerDay, 0, 20),
    daysActivePerWeek: clampInt(input.daysActivePerWeek, 1, 7),
    gradeDistribution: normalizeGradeDistribution(input.gradeDistribution),
    rhythmBonusMean: clampNumber(input.rhythmBonusMean, 0, 40),
    rhythmBonusStd: clampNumber(input.rhythmBonusStd, 0, 20),
    comboBonusMean: clampNumber(input.comboBonusMean, 0, 25),
    comboBonusStd: clampNumber(input.comboBonusStd, 0, 15),
    phaseDiversityRate: clampNumber(input.phaseDiversityRate, 0, 1),
    antiSpamPenaltyMean: clampNumber(input.antiSpamPenaltyMean, 0, 60),
    antiSpamPenaltyStd: clampNumber(input.antiSpamPenaltyStd, 0, 20),
  };
}

function normalizeGradeDistribution(value: GradeDistribution): GradeDistribution {
  const total =
    Math.max(0, value.C)
    + Math.max(0, value.B)
    + Math.max(0, value.A)
    + Math.max(0, value.S);

  if (total <= 0) {
    return {
      C: 0.2,
      B: 0.35,
      A: 0.3,
      S: 0.15,
    };
  }

  return {
    C: Math.max(0, value.C) / total,
    B: Math.max(0, value.B) / total,
    A: Math.max(0, value.A) / total,
    S: Math.max(0, value.S) / total,
  };
}

function sampleGrade(distribution: GradeDistribution, random: () => number): NeuroPassRunGrade {
  const roll = random();
  const c = distribution.C;
  const b = c + distribution.B;
  const a = b + distribution.A;

  if (roll < c) {
    return 'C';
  }

  if (roll < b) {
    return 'B';
  }

  if (roll < a) {
    return 'A';
  }

  return 'S';
}

function createHistogramBuckets(): HistogramBucket[] {
  const buckets: HistogramBucket[] = [];

  for (let min = HISTOGRAM_MIN; min <= HISTOGRAM_MAX; min += HISTOGRAM_BIN) {
    buckets.push({
      minInclusive: min,
      maxInclusive: Math.min(HISTOGRAM_MAX, min + HISTOGRAM_BIN - 1),
      count: 0,
    });
  }

  return buckets;
}

function updateHistogram(histogram: HistogramBucket[], value: number): void {
  const clamped = clampInt(value, HISTOGRAM_MIN, HISTOGRAM_MAX);
  const bucketIndex = Math.min(
    histogram.length - 1,
    Math.floor((clamped - HISTOGRAM_MIN) / HISTOGRAM_BIN),
  );

  const bucket = histogram[bucketIndex];
  if (!bucket) {
    return;
  }

  bucket.count += 1;
}

function sampleNormal(random: () => number, mean: number, stdDev: number): number {
  if (stdDev <= 0) {
    return mean;
  }

  const u1 = Math.max(1e-8, random());
  const u2 = Math.max(1e-8, random());
  const mag = Math.sqrt(-2 * Math.log(u1));
  const z0 = mag * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export function defaultSimulationInput(profile: NeuroPassPlayerProfile): NeuroPassSimulationInput {
  if (profile === 'P90') {
    return {
      seed: 20260221,
      profile,
      sessionsPerDay: 8,
      daysActivePerWeek: 6,
      gradeDistribution: { C: 0.05, B: 0.2, A: 0.45, S: 0.3 },
      rhythmBonusMean: 31,
      rhythmBonusStd: 4,
      comboBonusMean: 19,
      comboBonusStd: 4,
      phaseDiversityRate: 0.95,
      antiSpamPenaltyMean: 4,
      antiSpamPenaltyStd: 2,
    };
  }

  if (profile === 'P75') {
    return {
      seed: 20260221,
      profile,
      sessionsPerDay: 5,
      daysActivePerWeek: 5,
      gradeDistribution: { C: 0.12, B: 0.34, A: 0.36, S: 0.18 },
      rhythmBonusMean: 25,
      rhythmBonusStd: 5,
      comboBonusMean: 15,
      comboBonusStd: 5,
      phaseDiversityRate: 0.82,
      antiSpamPenaltyMean: 8,
      antiSpamPenaltyStd: 4,
    };
  }

  return {
    seed: 20260221,
    profile: 'P50',
    sessionsPerDay: 3,
    daysActivePerWeek: 4,
    gradeDistribution: { C: 0.22, B: 0.42, A: 0.27, S: 0.09 },
    rhythmBonusMean: 18,
    rhythmBonusStd: 7,
    comboBonusMean: 9,
    comboBonusStd: 6,
    phaseDiversityRate: 0.65,
    antiSpamPenaltyMean: 14,
    antiSpamPenaltyStd: 6,
  };
}
