import { AnalyticsService } from '@core/analytics/AnalyticsService';
import { neuroPassEvents } from '@core/analytics/events';
import {
  NEURO_PASS_TIERS_TOTAL,
  NEURO_PASS_XP_PER_TIER,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import { buildNeuroPassProgress } from '@features/neuroPass/domain/entities/NeuroPassProgress';
import { neuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';
import { NeuroPassQuestEngine } from '@features/neuroPass/domain/quests/NeuroPassQuestEngine';
import type { NeuroPassQuestState, NeuroPassQuestsStateBundle } from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import {
  NEURO_PASS_BOSS_WEEKLY_NXP,
  NEURO_PASS_BOSS_WEEKLY_QUEST_ID,
  NEURO_PASS_DAILY_QUEST_NXP,
  NEURO_PASS_WEEKLY_QUEST_NXP,
  neuroPassQuestPeriod,
  neuroPassQuestStatus,
} from '@features/neuroPass/domain/quests/QuestTypes';
import type { NeuroPassQuestsRepository } from '@features/neuroPass/domain/repositories/NeuroPassQuestsRepository';
import type { NeuroPassRepository } from '@features/neuroPass/domain/repositories/NeuroPassRepository';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import { getPeriodKeysUtc } from '@features/neuroPass/domain/utils/periodKeys';

export type ClaimQuestPeriod =
  | typeof neuroPassQuestPeriod.daily
  | typeof neuroPassQuestPeriod.weekly
  | typeof neuroPassQuestPeriod.bossWeekly;

export interface ClaimQuestXpInput {
  period: ClaimQuestPeriod;
  questId?: string;
}

export interface ClaimQuestXpResult {
  grantedAmount: number;
  isDuplicate: boolean;
  blocked: boolean;
  reason?: 'not_found' | 'not_completed' | 'already_claimed';
  period: ClaimQuestPeriod;
  questId: string;
  tierBefore: number;
  tierAfter: number;
}

export class ClaimQuestXp {
  constructor(
    private readonly questsRepository: NeuroPassQuestsRepository,
    private readonly repository: NeuroPassRepository,
    private readonly xpLedgerRepository: NeuroPassXpLedgerRepository,
    private readonly questEngine: NeuroPassQuestEngine,
    private readonly analytics: AnalyticsService,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(input: ClaimQuestXpInput): Promise<ClaimQuestXpResult> {
    const nowUtc = new Date(this.now());
    const nowIso = nowUtc.toISOString();
    const { dailyKey, weeklyKey } = getPeriodKeysUtc(nowUtc);

    const seasonId = (await this.repository.readLastSeenSeasonId()) ?? 'unknown_season';

    const progressBeforeRaw = await this.repository.readProgress();
    const progressBefore = buildNeuroPassProgress({
      currentNxp: progressBeforeRaw.currentNxp,
      lastUpdatedAtUtc: progressBeforeRaw.lastUpdatedAtUtc,
      xpPerTier: NEURO_PASS_XP_PER_TIER,
      tiersTotal: NEURO_PASS_TIERS_TOTAL,
    });

    const storedState = await this.questsRepository.readQuestState();
    const init = this.questEngine.initOrReset({
      seasonId,
      dailyKey,
      weeklyKey,
      storedState,
    });

    const resolvedQuestId = resolveQuestId(input.period, input.questId);
    const resolved = resolveQuestFromState(init.state, input.period, resolvedQuestId);

    if (!resolved.quest) {
      if (init.changed) {
        await this.questsRepository.writeQuestState(init.state);
      }

      return {
        grantedAmount: 0,
        isDuplicate: false,
        blocked: true,
        reason: 'not_found',
        period: input.period,
        questId: resolvedQuestId,
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
      };
    }

    if (resolved.quest.status === neuroPassQuestStatus.active) {
      if (init.changed) {
        await this.questsRepository.writeQuestState(init.state);
      }

      return {
        grantedAmount: 0,
        isDuplicate: false,
        blocked: true,
        reason: 'not_completed',
        period: input.period,
        questId: resolved.quest.questId,
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
      };
    }

    if (resolved.quest.status === neuroPassQuestStatus.claimed) {
      if (init.changed) {
        await this.questsRepository.writeQuestState(init.state);
      }

      return {
        grantedAmount: 0,
        isDuplicate: true,
        blocked: true,
        reason: 'already_claimed',
        period: input.period,
        questId: resolved.quest.questId,
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
      };
    }

    const amount = rewardForPeriod(input.period);
    const source = sourceForPeriod(input.period);
    const periodKey = input.period === neuroPassQuestPeriod.daily ? dailyKey : weeklyKey;
    const grantId = `${periodKey}:${resolved.quest.questId}`;

    const alreadyGranted = await this.xpLedgerRepository.hasGrant(grantId, source);
    if (alreadyGranted) {
      const markedState = markQuestClaimed(init.state, input.period, resolved.quest.questId, nowIso);
      await this.questsRepository.writeQuestState(markedState);

      return {
        grantedAmount: 0,
        isDuplicate: true,
        blocked: false,
        period: input.period,
        questId: resolved.quest.questId,
        tierBefore: progressBefore.currentTier,
        tierAfter: progressBefore.currentTier,
      };
    }

    await this.xpLedgerRepository.append({
      id: grantId,
      source,
      amount,
      createdAtUtc: nowIso,
      meta: {
        dayKeyUtc: periodKey,
        questId: resolved.quest.questId,
      },
    });

    const progressAfterRaw = {
      currentNxp: progressBefore.currentNxp + amount,
      lastUpdatedAtUtc: nowIso,
    };
    await this.repository.writeProgress(progressAfterRaw);

    const markedState = markQuestClaimed(init.state, input.period, resolved.quest.questId, nowIso);
    await this.questsRepository.writeQuestState(markedState);

    const progressAfter = buildNeuroPassProgress({
      currentNxp: progressAfterRaw.currentNxp,
      lastUpdatedAtUtc: progressAfterRaw.lastUpdatedAtUtc,
      xpPerTier: NEURO_PASS_XP_PER_TIER,
      tiersTotal: NEURO_PASS_TIERS_TOTAL,
    });

    this.analytics.track(neuroPassEvents.questClaimed, {
      period: input.period,
      quest_id: resolved.quest.questId,
      amount,
    });

    this.analytics.track(neuroPassEvents.xpGranted, {
      source,
      amount,
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
      grantedAmount: amount,
      isDuplicate: false,
      blocked: false,
      period: input.period,
      questId: resolved.quest.questId,
      tierBefore: progressBefore.currentTier,
      tierAfter: progressAfter.currentTier,
    };
  }
}

function resolveQuestId(period: ClaimQuestPeriod, questId: string | undefined): string {
  if (period === neuroPassQuestPeriod.bossWeekly) {
    return NEURO_PASS_BOSS_WEEKLY_QUEST_ID;
  }

  return (questId ?? '').trim();
}

function resolveQuestFromState(
  state: NeuroPassQuestsStateBundle,
  period: ClaimQuestPeriod,
  questId: string,
): { quest: NeuroPassQuestState | null } {
  if (period === neuroPassQuestPeriod.daily) {
    return {
      quest: state.daily.find((item) => item.questId === questId) ?? null,
    };
  }

  if (period === neuroPassQuestPeriod.weekly) {
    return {
      quest: state.weekly.find((item) => item.questId === questId) ?? null,
    };
  }

  if (state.bossWeekly?.questId === questId) {
    return {
      quest: state.bossWeekly,
    };
  }

  return {
    quest: null,
  };
}

function rewardForPeriod(period: ClaimQuestPeriod): number {
  switch (period) {
    case neuroPassQuestPeriod.daily:
      return NEURO_PASS_DAILY_QUEST_NXP;
    case neuroPassQuestPeriod.weekly:
      return NEURO_PASS_WEEKLY_QUEST_NXP;
    case neuroPassQuestPeriod.bossWeekly:
      return NEURO_PASS_BOSS_WEEKLY_NXP;
    default:
      return 0;
  }
}

function sourceForPeriod(period: ClaimQuestPeriod) {
  switch (period) {
    case neuroPassQuestPeriod.daily:
      return neuroPassXpSource.dailyQuest;
    case neuroPassQuestPeriod.weekly:
      return neuroPassXpSource.weeklyQuest;
    case neuroPassQuestPeriod.bossWeekly:
      return neuroPassXpSource.bossWeekly;
    default:
      return neuroPassXpSource.dailyQuest;
  }
}

function markQuestClaimed(
  state: NeuroPassQuestsStateBundle,
  period: ClaimQuestPeriod,
  questId: string,
  claimedAtUtc: string,
): NeuroPassQuestsStateBundle {
  if (period === neuroPassQuestPeriod.daily) {
    return {
      ...state,
      daily: state.daily.map((quest) => {
        if (quest.questId !== questId) {
          return quest;
        }

        return {
          ...quest,
          status: neuroPassQuestStatus.claimed,
          progress: quest.target,
          claimedAtUtc,
          completedAtUtc: quest.completedAtUtc ?? claimedAtUtc,
        };
      }),
    };
  }

  if (period === neuroPassQuestPeriod.weekly) {
    return {
      ...state,
      weekly: state.weekly.map((quest) => {
        if (quest.questId !== questId) {
          return quest;
        }

        return {
          ...quest,
          status: neuroPassQuestStatus.claimed,
          progress: quest.target,
          claimedAtUtc,
          completedAtUtc: quest.completedAtUtc ?? claimedAtUtc,
        };
      }),
    };
  }

  if (!state.bossWeekly || state.bossWeekly.questId !== questId) {
    return state;
  }

  return {
    ...state,
    bossWeekly: {
      ...state.bossWeekly,
      status: neuroPassQuestStatus.claimed,
      progress: state.bossWeekly.target,
      claimedAtUtc,
      completedAtUtc: state.bossWeekly.completedAtUtc ?? claimedAtUtc,
    },
  };
}
