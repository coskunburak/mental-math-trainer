import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import {
  NEURO_PASS_TIERS_TOTAL,
  NEURO_PASS_XP_PER_TIER,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import {
  type NeuroPassCapState,
  type NeuroPassRunGrade,
} from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import {
  type NeuroPassSecurityConfig,
  DEFAULT_NEURO_PASS_SECURITY_CONFIG,
} from '@features/neuroPass/domain/config/NeuroPassSecurityConfig';
import { makeXpGrantIdFromRun } from '@features/neuroPass/domain/idempotency/keys';
import { neuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';
import { buildNeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';
import { TimeSpoofHeuristic } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type { NeuroPassProgressRepository } from '@features/neuroPass/domain/repositories/NeuroPassProgressRepository';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import {
  type NeuroPassAntiSpamSignals,
  NeuroPassAntiAbuseGuard,
} from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';
import { clampInt, clampNumber } from '@features/neuroPass/domain/utils/math';
import { utcDayKey } from '@features/neuroPass/domain/utils/time';

const REQUIRED_PHASES = ['rhythm_math', 'puzzle', 'cognitive_blend', 'boss'] as const;

export interface NeuroPassRunPhaseStatsInput {
  total?: number;
  perfect?: number;
  great?: number;
  good?: number;
  offbeat?: number;
}

export interface NeuroPassRunSummaryInput {
  runId: string;
  grade: NeuroPassRunGrade;
  accuracy: number;
  durationMs?: number;
  avgBeatOffsetMs?: number;
  bestCombo?: number;
  rhythmBonus?: number;
  comboBonus?: number;
  phasesPlayed?: string[];
  phaseBreakdown?: Record<string, NeuroPassRunPhaseStatsInput>;
  antiSpamSignals?: NeuroPassAntiSpamSignals;
}

export interface GrantNeuroPassXpFromRunResult {
  grantedAmount: number;
  isDuplicate: boolean;
  capState: NeuroPassCapState;
  tierBefore: number;
  tierAfter: number;
  blockedReason?: 'invalid_run_id' | 'replay';
}

export class GrantNeuroPassXpFromRun {
  constructor(
    private readonly progressRepository: NeuroPassProgressRepository,
    private readonly xpLedgerRepository: NeuroPassXpLedgerRepository,
    private readonly economyPolicy: NeuroPassEconomyPolicy,
    private readonly antiAbuseGuard: NeuroPassAntiAbuseGuard,
    private readonly timeSpoofHeuristic: TimeSpoofHeuristic,
    private readonly securityConfig: NeuroPassSecurityConfig = DEFAULT_NEURO_PASS_SECURITY_CONFIG,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
    private readonly monotonicNow: () => number | undefined = defaultMonotonicNow,
  ) {}

  async execute(runSummary: NeuroPassRunSummaryInput): Promise<GrantNeuroPassXpFromRunResult> {
    const nowUtc = new Date(this.now());
    const nowIso = nowUtc.toISOString();
    const runGrantId = makeXpGrantIdFromRun(runSummary.runId);

    const progressBeforeRaw = await this.progressRepository.readProgress();
    const progressBefore = buildNeuroPassProgress({
      currentNxp: progressBeforeRaw.currentNxp,
      lastUpdatedAtUtc: progressBeforeRaw.lastUpdatedAtUtc,
      xpPerTier: NEURO_PASS_XP_PER_TIER,
      tiersTotal: NEURO_PASS_TIERS_TOTAL,
    });

    if (!runGrantId) {
      return {
        grantedAmount: 0,
        isDuplicate: true,
        capState: 'none',
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
        blockedReason: 'invalid_run_id',
      };
    }

    await this.xpLedgerRepository.rebuildSeenRunIdsIndex(false);
    const replayBlocked = await this.xpLedgerRepository.hasSeenRunId(runGrantId);
    if (replayBlocked || await this.xpLedgerRepository.hasGrant(runGrantId, neuroPassXpSource.run)) {
      this.analytics.track(neuroPassEvents.replayBlocked, {
        run_id_hash_prefix: hashRunIdPrefix(runGrantId),
      });
      return {
        grantedAmount: 0,
        isDuplicate: true,
        capState: 'none',
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
        blockedReason: 'replay',
      };
    }

    const previousTimeState = await this.progressRepository.readTimeHeuristicState();
    const timeHeuristic = this.timeSpoofHeuristic.evaluate(
      previousTimeState,
      {
        wallClockUtcIso: nowIso,
        monotonicMs: this.monotonicNow(),
      },
      this.securityConfig,
    );
    await this.progressRepository.writeTimeHeuristicState(timeHeuristic.nextState);

    if (timeHeuristic.triggered) {
      this.analytics.track(neuroPassEvents.timeSuspicious, {
        delta_ms: timeHeuristic.deltaMs,
        severity: timeHeuristic.severity,
      });
    }

    const rhythmBonus = deriveRhythmBonus(runSummary);
    const comboBonus = deriveComboBonus(runSummary);
    const playedAllFourPhases = detectAllFourPhasesPlayed(runSummary);
    const phaseDiversityBonus = this.economyPolicy.computePhaseDiversityBonus({
      accuracy: clampNumber(runSummary.accuracy, 0, 1),
      playedAllFourPhases,
    });
    const antiAbuse = this.antiAbuseGuard.evaluate(
      runSummary.antiSpamSignals ?? {},
    );
    const antiSpamPenalty = antiAbuse.penalty;

    if (antiAbuse.spamScore >= 0.55 || antiSpamPenalty >= 28) {
      this.analytics.track(neuroPassEvents.spamDetected, {
        spam_score: antiAbuse.spamScore,
        penalty: antiSpamPenalty,
      });
    }

    const computedPreCap = this.economyPolicy.computeRunBaseNxp({
      grade: runSummary.grade,
      rhythmBonus,
      comboBonus,
      phaseDiversityBonus,
      antiSpamPenalty,
    });
    const nxpPreCap =
      timeHeuristic.suspicious && this.securityConfig.suspiciousTimeMode === 'clamp_to_min'
        ? Math.min(60, computedPreCap)
        : computedPreCap;

    const todayRunTotal = await this.xpLedgerRepository.getTodayRunTotal(nowUtc);
    const cap = this.economyPolicy.applyDailyCaps(todayRunTotal, nxpPreCap);
    const todayTotalNxp = await this.xpLedgerRepository.getTodayTotalNxp(nowUtc);
    const anomalyFlagged = todayTotalNxp > this.securityConfig.anomalyDailyNxpThreshold;
    const anomalyAdjustedAmount = anomalyFlagged && this.securityConfig.anomalyRunReductionEnabled
      ? clampInt(
        Math.round(cap.amount * this.securityConfig.anomalyRunReductionMultiplier),
        0,
        cap.amount,
      )
      : cap.amount;

    await this.xpLedgerRepository.append({
      id: runGrantId,
      source: neuroPassXpSource.run,
      amount: anomalyAdjustedAmount,
      createdAtUtc: nowIso,
      meta: {
        grade: runSummary.grade,
        softCapped: cap.softCapped,
        hardCapped: cap.hardCapped,
        runAccuracy: clampNumber(runSummary.accuracy, 0, 1),
        rhythmBonus,
        comboBonus,
        phaseDiversityBonus,
        antiSpamPenalty,
        capState: cap.capState,
        dayKeyUtc: utcDayKey(nowUtc),
      },
    });

    const progressAfterRaw = {
      currentNxp: progressBefore.currentNxp + anomalyAdjustedAmount,
      lastUpdatedAtUtc: nowIso,
    };
    await this.progressRepository.writeProgress(progressAfterRaw);

    const progressAfter = buildNeuroPassProgress({
      currentNxp: progressAfterRaw.currentNxp,
      lastUpdatedAtUtc: progressAfterRaw.lastUpdatedAtUtc,
      xpPerTier: NEURO_PASS_XP_PER_TIER,
      tiersTotal: NEURO_PASS_TIERS_TOTAL,
    });

    const seasonId = (await this.progressRepository.readLastSeenSeasonId()) ?? 'unknown_season';

    this.analytics.track(neuroPassEvents.xpGranted, {
      source: neuroPassXpSource.run,
      amount: anomalyAdjustedAmount,
      run_grade: runSummary.grade,
      day_total_run_nxp: todayRunTotal + anomalyAdjustedAmount,
      soft_capped: cap.softCapped,
      hard_capped: cap.hardCapped,
      suspicious_time: timeHeuristic.suspicious,
      anomaly_flagged: anomalyFlagged,
    });

    if (progressAfter.currentTier > progressBefore.currentTier) {
      for (let tier = progressBefore.currentTier + 1; tier <= progressAfter.currentTier; tier += 1) {
        this.analytics.track(neuroPassEvents.tierReached, {
          tier,
          season_id: seasonId,
        });
      }
    }

    return {
      grantedAmount: anomalyAdjustedAmount,
      isDuplicate: false,
      capState: cap.capState,
      tierBefore: progressBefore.currentTier,
      tierAfter: progressAfter.currentTier,
    };
  }
}

function hashRunIdPrefix(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return '0';
  }

  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).slice(0, 8);
}

function detectAllFourPhasesPlayed(summary: NeuroPassRunSummaryInput): boolean {
  if (Array.isArray(summary.phasesPlayed) && summary.phasesPlayed.length > 0) {
    const set = new Set(summary.phasesPlayed);
    return REQUIRED_PHASES.every((phase) => set.has(phase));
  }

  if (!summary.phaseBreakdown) {
    return false;
  }

  return REQUIRED_PHASES.every((phase) => {
    const stats = summary.phaseBreakdown?.[phase];
    return Number(stats?.total ?? 0) > 0;
  });
}

function deriveComboBonus(summary: NeuroPassRunSummaryInput): number {
  if (typeof summary.comboBonus === 'number' && Number.isFinite(summary.comboBonus)) {
    return clampInt(summary.comboBonus, 0, 25);
  }

  const bestCombo = Math.max(0, Number(summary.bestCombo ?? 0));
  if (bestCombo <= 0) {
    return 0;
  }

  // Smooth saturation curve: rewards combo growth but plateaus near cap.
  const curve = 1 - Math.exp(-bestCombo / 10);
  return clampInt(Math.round(curve * 25), 0, 25);
}

function deriveRhythmBonus(summary: NeuroPassRunSummaryInput): number {
  if (typeof summary.rhythmBonus === 'number' && Number.isFinite(summary.rhythmBonus)) {
    return clampInt(summary.rhythmBonus, 0, 40);
  }

  const phaseValues = summary.phaseBreakdown ? Object.values(summary.phaseBreakdown) : [];

  const perfect = phaseValues.reduce((sum, item) => sum + Math.max(0, Number(item?.perfect ?? 0)), 0);
  const great = phaseValues.reduce((sum, item) => sum + Math.max(0, Number(item?.great ?? 0)), 0);
  const good = phaseValues.reduce((sum, item) => sum + Math.max(0, Number(item?.good ?? 0)), 0);
  const offbeat = phaseValues.reduce((sum, item) => sum + Math.max(0, Number(item?.offbeat ?? 0)), 0);

  const qualityTotal = perfect + great + good + offbeat;
  const weightedQuality = qualityTotal > 0
    ? (perfect + great * 0.75 + good * 0.4) / qualityTotal
    : 0;

  const avgOffset = Math.abs(Number(summary.avgBeatOffsetMs ?? 200));
  const offsetFactor = 1 - clampNumber(avgOffset / 220, 0, 1);

  // 70% timing quality + 30% average offset smoothes noisy beat histograms.
  const blended = clampNumber(weightedQuality * 0.7 + offsetFactor * 0.3, 0, 1);
  return clampInt(Math.round(blended * 40), 0, 40);
}

function defaultMonotonicNow(): number | undefined {
  const maybePerformance = globalThis.performance;
  if (!maybePerformance || typeof maybePerformance.now !== 'function') {
    return undefined;
  }

  const nowValue = maybePerformance.now();
  return Number.isFinite(nowValue) ? nowValue : undefined;
}
