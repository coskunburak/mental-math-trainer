import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import type { NeuroPassQuestRunSummary } from '@features/neuroPass/domain/quests/NeuroPassQuestDefinition';
import type { NeuroPassQuestState } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';
import type { NeuroPassRepository } from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import {
  type NeuroPassAntiSpamSignals,
  NeuroPassAntiAbuseGuard,
} from '@features/neuroPass/domain/services/NeuroPassAntiAbuseGuard';
import { clampInt, clampNumber } from '@features/neuroPass/domain/utils/math';
import { getPeriodKeysUtc } from '@features/neuroPass/domain/utils/periodKeys';

export interface UpdateQuestsFromRunSummaryInput {
  runId: string;
  endedAtUtc?: string;
  grade: 'C' | 'B' | 'A' | 'S';
  accuracy: number;
  bestCombo: number;
  avgBeatOffsetMs: number;
  totalQuestions: number;
  durationMs: number;
  phasesPlayed: string[];
  bossCompleted: boolean;
  antiSpamPenalty?: number;
  antiSpamSignals?: NeuroPassAntiSpamSignals;
}

export interface UpdateQuestsFromRunSummaryResult {
  seasonId: string;
  dailyKey: string;
  weeklyKey: string;
  daily: NeuroPassQuestState[];
  weekly: NeuroPassQuestState[];
  bossWeekly: NeuroPassQuestState | null;
}

export class UpdateQuestsFromRunSummary {
  constructor(
    private readonly questsRepository: NeuroPassQuestsRepository,
    private readonly repository: NeuroPassRepository,
    private readonly xpLedgerRepository: NeuroPassXpLedgerRepository,
    private readonly questEngine: NeuroPassQuestEngine,
    private readonly antiAbuseGuard: NeuroPassAntiAbuseGuard,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(input: UpdateQuestsFromRunSummaryInput): Promise<UpdateQuestsFromRunSummaryResult> {
    const nowUtc = new Date(this.now());
    const { dailyKey, weeklyKey } = getPeriodKeysUtc(nowUtc);
    const seasonId = (await this.repository.readLastSeenSeasonId()) ?? 'unknown_season';

    const storedState = await this.questsRepository.readQuestState();
    const init = this.questEngine.initOrReset({
      seasonId,
      dailyKey,
      weeklyKey,
      storedState,
    });

    const normalizedRunSummary = normalizeRunSummary(
      input,
      this.antiAbuseGuard,
      nowUtc,
    );

    const ledgerGrants = await this.xpLedgerRepository.listAll();
    const applied = this.questEngine.applyRunSummaryToQuests({
      state: init.state,
      runSummary: normalizedRunSummary,
      ledgerGrants,
    });

    if (init.changed || applied.changed) {
      await this.questsRepository.writeQuestState(applied.state);
    }

    applied.progressed.forEach((event) => {
      this.analytics.track(neuroPassEvents.questProgressed, {
        period: event.period,
        quest_id: event.questId,
        progress: event.progress,
        target: event.target,
      });
    });

    applied.completed.forEach((event) => {
      this.analytics.track(neuroPassEvents.questCompleted, {
        period: event.period,
        quest_id: event.questId,
      });
    });

    return {
      seasonId,
      dailyKey,
      weeklyKey,
      daily: applied.state.daily,
      weekly: applied.state.weekly,
      bossWeekly: applied.state.bossWeekly,
    };
  }
}

function normalizeRunSummary(
  input: UpdateQuestsFromRunSummaryInput,
  antiAbuseGuard: NeuroPassAntiAbuseGuard,
  nowUtc: Date,
): NeuroPassQuestRunSummary {
  const endedAtUtc = asIso(input.endedAtUtc) ?? nowUtc.toISOString();

  const antiSpamPenalty = typeof input.antiSpamPenalty === 'number'
    ? clampInt(input.antiSpamPenalty, 0, 60)
    : antiAbuseGuard.computeAntiSpamPenalty(input.antiSpamSignals ?? {});

  return {
    runId: input.runId.trim(),
    endedAtUtc,
    grade: normalizeGrade(input.grade),
    accuracy: clampNumber(input.accuracy, 0, 1),
    bestCombo: Math.max(0, Math.floor(input.bestCombo)),
    avgBeatOffsetMs: Math.max(0, Math.round(Math.abs(input.avgBeatOffsetMs))),
    totalQuestions: Math.max(0, Math.floor(input.totalQuestions)),
    durationMs: Math.max(0, Math.floor(input.durationMs)),
    phasesPlayed: dedupePhases(input.phasesPlayed),
    antiSpamPenalty,
    bossCompleted: Boolean(input.bossCompleted),
  };
}

function asIso(value: string | undefined): string | undefined {
  if (!value || Number.isNaN(Date.parse(value))) {
    return undefined;
  }

  return value;
}

function normalizeGrade(value: string): 'C' | 'B' | 'A' | 'S' {
  if (value === 'S' || value === 'A' || value === 'B') {
    return value;
  }

  return 'C';
}

function dedupePhases(value: string[]): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((item) => typeof item === 'string' && item.trim().length > 0))];
}
