import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import {
  NEURO_PASS_TIERS_TOTAL,
  NEURO_PASS_XP_PER_TIER,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import { buildNeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';
import { neuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';
import type { NeuroPassRepository } from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import { utcDayKey } from '@features/neuroPass/domain/utils/time';

export interface ClaimDailyQuestXpResult {
  grantedAmount: number;
  isDuplicate: boolean;
  tierBefore: number;
  tierAfter: number;
}

const DAILY_QUEST_NXP = 120;

export class ClaimDailyQuestXp {
  constructor(
    private readonly repository: NeuroPassRepository,
    private readonly xpLedgerRepository: NeuroPassXpLedgerRepository,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(questId: string): Promise<ClaimDailyQuestXpResult> {
    const normalizedQuestId = questId.trim().slice(0, 40);
    const progressBeforeRaw = await this.repository.readProgress();
    const progressBefore = buildNeuroPassProgress({
      currentNxp: progressBeforeRaw.currentNxp,
      lastUpdatedAtUtc: progressBeforeRaw.lastUpdatedAtUtc,
      xpPerTier: NEURO_PASS_XP_PER_TIER,
      tiersTotal: NEURO_PASS_TIERS_TOTAL,
    });

    if (normalizedQuestId.length === 0) {
      return {
        grantedAmount: 0,
        isDuplicate: true,
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
      };
    }

    const nowUtc = new Date(this.now());
    const nowIso = nowUtc.toISOString();
    const dayKey = utcDayKey(nowUtc);
    const grantId = `${dayKey}:${normalizedQuestId}`;

    const alreadyGranted = await this.xpLedgerRepository.hasGrant(grantId, neuroPassXpSource.dailyQuest);
    if (alreadyGranted) {
      return {
        grantedAmount: 0,
        isDuplicate: true,
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
      };
    }

    await this.xpLedgerRepository.append({
      id: grantId,
      source: neuroPassXpSource.dailyQuest,
      amount: DAILY_QUEST_NXP,
      createdAtUtc: nowIso,
      meta: {
        questId: normalizedQuestId,
        dayKeyUtc: dayKey,
      },
    });

    const progressAfterRaw = {
      currentNxp: progressBefore.currentNxp + DAILY_QUEST_NXP,
      lastUpdatedAtUtc: nowIso,
    };
    await this.repository.writeProgress(progressAfterRaw);

    const progressAfter = buildNeuroPassProgress({
      currentNxp: progressAfterRaw.currentNxp,
      lastUpdatedAtUtc: progressAfterRaw.lastUpdatedAtUtc,
      xpPerTier: NEURO_PASS_XP_PER_TIER,
      tiersTotal: NEURO_PASS_TIERS_TOTAL,
    });

    const seasonId = (await this.repository.readLastSeenSeasonId()) ?? 'unknown_season';

    this.analytics.track(neuroPassEvents.xpGranted, {
      source: 'daily',
      amount: DAILY_QUEST_NXP,
      day_total_run_nxp: await this.xpLedgerRepository.getTodayRunTotal(nowUtc),
      soft_capped: false,
      hard_capped: false,
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
      grantedAmount: DAILY_QUEST_NXP,
      isDuplicate: false,
      tierBefore: progressBefore.currentTier,
      tierAfter: progressAfter.currentTier,
    };
  }
}
