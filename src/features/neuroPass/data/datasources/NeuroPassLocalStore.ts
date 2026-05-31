import type { KeyValueStore } from '@core/storage/KeyValueStore';
import { storageKeys } from '@core/storage/storageKeys';
import type {
  NeuroPassClaimPlaceholderModel,
  NeuroPassPersistedEntitlementModel,
  NeuroPassPersistedProgressModel,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';
import {
  buildDefaultNeuroPassEntitlement,
  type NeuroPassEntitlement,
} from '@features/neuroPass/domain/entities/NeuroPassEntitlement';
import {
  applyNeuroPassInventoryCurrencyDelta,
  applyNeuroPassInventoryReward,
  DEFAULT_NEURO_PASS_INVENTORY,
  normalizeNeuroPassInventory,
  type NeuroPassInventory,
  type NeuroPassInventoryCurrencyDelta,
} from '@features/neuroPass/domain/entities/NeuroPassInventory';
import type { NeuroPassReward } from '@features/neuroPass/domain/entities/NeuroPassReward';
import type { NeuroPassIapPurchaseRecord } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';
import type { NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassTimeHeuristicState } from '@features/neuroPass/domain/antiAbuse/TimeSpoofHeuristic';
import type {
  NeuroPassQuestState,
  NeuroPassQuestsStateBundle,
} from '@features/neuroPass/domain/quests/NeuroPassQuestState';
import type { NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

const SCHEMA_VERSION = 1;

interface PersistedPayload<T> {
  schemaVersion: number;
  data: T;
}

const DEFAULT_PROGRESS: NeuroPassPersistedProgressModel = {
  currentNxp: 0,
  lastUpdatedAtUtc: new Date(0).toISOString(),
};

const DEFAULT_ENTITLEMENT: NeuroPassPersistedEntitlementModel = {
  seasonId: 'legacy_default',
  premiumOwned: false,
  passSkuPurchased: null,
  plusTierSkipsRemaining: 0,
  purchasedTierSkipsBalance: 0,
  tierSkipsPurchasedTodayCount: 0,
  bonusUnlockedTiers: 0,
  purchasedSkus: [],
};

const DEFAULT_CLAIM_PLACEHOLDER: NeuroPassClaimPlaceholderModel = {
  claimedRewardKeys: [],
};

const DEFAULT_XP_GRANTS: NeuroPassXpGrant[] = [];
const DEFAULT_IAP_RECORDS: NeuroPassIapPurchaseRecord[] = [];
export interface NeuroPassSeenRunIdRecord {
  runId: string;
  createdAtUtc: string;
}

const DEFAULT_SEEN_RUN_IDS: NeuroPassSeenRunIdRecord[] = [];
const DEFAULT_TIME_HEURISTIC_STATE: NeuroPassTimeHeuristicState = {
  suspiciousTime: false,
  stableSamples: 0,
};
const DEFAULT_QUEST_STATE: NeuroPassQuestsStateBundle = {
  seasonId: '',
  dailyKey: '',
  weeklyKey: '',
  daily: [],
  weekly: [],
  bossWeekly: null,
};

export class NeuroPassLocalStore {
  constructor(private readonly storage: KeyValueStore) {}

  async readCachedManifest(): Promise<string | null> {
    const raw = await this.storage.getString(storageKeys.neuroPassCachedManifest);
    if (!raw || raw.trim().length === 0) {
      return null;
    }

    return raw;
  }

  async writeCachedManifest(rawJson: string): Promise<void> {
    await this.storage.setString(storageKeys.neuroPassCachedManifest, rawJson);
  }

  async readProgress(): Promise<NeuroPassPersistedProgressModel> {
    return this.readTypedPayload(
      storageKeys.neuroPassProgress,
      DEFAULT_PROGRESS,
      normalizeProgress,
    );
  }

  async writeProgress(progress: NeuroPassPersistedProgressModel): Promise<void> {
    await this.writeTypedPayload(storageKeys.neuroPassProgress, normalizeProgress(progress));
  }

  async getProgress(): Promise<NeuroPassPersistedProgressModel> {
    return this.readProgress();
  }

  async setProgress(progress: NeuroPassPersistedProgressModel): Promise<void> {
    await this.writeProgress(progress);
  }

  async readEntitlement(): Promise<NeuroPassPersistedEntitlementModel> {
    return this.readTypedPayload(
      storageKeys.neuroPassEntitlement,
      DEFAULT_ENTITLEMENT,
      normalizeEntitlement,
    );
  }

  async writeEntitlement(entitlement: NeuroPassPersistedEntitlementModel): Promise<void> {
    await this.writeTypedPayload(
      storageKeys.neuroPassEntitlement,
      normalizeEntitlement(entitlement),
    );
  }

  async getEntitlement(seasonId: string): Promise<NeuroPassEntitlement> {
    const key = entitlementStorageKey(seasonId);
    const payload = await this.readTypedPayload(
      key,
      normalizeEntitlement({
        ...DEFAULT_ENTITLEMENT,
        seasonId,
      }),
      normalizeEntitlement,
    );

    return toDomainEntitlement(payload, seasonId);
  }

  async setEntitlement(seasonId: string, entitlement: NeuroPassEntitlement): Promise<void> {
    const key = entitlementStorageKey(seasonId);
    const normalized = normalizeEntitlement({
      seasonId,
      premiumOwned: entitlement.premiumOwned,
      passSkuPurchased: entitlement.passSkuPurchased,
      plusTierSkipsRemaining: entitlement.plusTierSkipsRemaining,
      purchasedTierSkipsBalance: entitlement.purchasedTierSkipsBalance,
      tierSkipsPurchasedTodayCount: entitlement.tierSkipsPurchasedTodayCount,
      bonusUnlockedTiers: entitlement.bonusUnlockedTiers,
      lastPurchaseAtUtc: entitlement.lastPurchaseAtUtc,
      lastRestoreAtUtc: entitlement.lastRestoreAtUtc,
      purchasedSkus: entitlement.purchasedSkus,
    });
    await this.writeTypedPayload(key, normalized);

    // Keep legacy entitlement key in sync for dashboard compatibility.
    await this.writeEntitlement(normalized);
  }

  async readClaimPlaceholder(): Promise<NeuroPassClaimPlaceholderModel> {
    return this.readTypedPayload(
      storageKeys.neuroPassClaimPlaceholder,
      DEFAULT_CLAIM_PLACEHOLDER,
      normalizeClaimPlaceholder,
    );
  }

  async writeClaimPlaceholder(claimState: NeuroPassClaimPlaceholderModel): Promise<void> {
    await this.writeTypedPayload(
      storageKeys.neuroPassClaimPlaceholder,
      normalizeClaimPlaceholder(claimState),
    );
  }

  async getIapPurchaseRecords(): Promise<NeuroPassIapPurchaseRecord[]> {
    return this.readTypedPayload(
      storageKeys.neuroPassIapRecords,
      DEFAULT_IAP_RECORDS,
      normalizeIapPurchaseRecords,
    );
  }

  async upsertIapPurchaseRecord(record: NeuroPassIapPurchaseRecord): Promise<void> {
    const records = await this.getIapPurchaseRecords();
    const normalized = normalizeIapPurchaseRecord(record);
    const index = records.findIndex((item) =>
      item.transactionId === normalized.transactionId || item.purchaseToken === normalized.purchaseToken,
    );

    if (index >= 0) {
      records[index] = normalized;
    } else {
      records.push(normalized);
    }

    await this.writeTypedPayload(storageKeys.neuroPassIapRecords, records.slice(-400));
  }

  async getTierSkipDailyCounter(dayKey: string): Promise<number> {
    const key = tierSkipDayStorageKey(dayKey);
    const raw = await this.storage.getString(key);
    if (!raw) {
      return 0;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  async setTierSkipDailyCounter(dayKey: string, count: number): Promise<void> {
    const key = tierSkipDayStorageKey(dayKey);
    await this.storage.setString(key, String(Math.max(0, Math.floor(count))));
  }

  async getClaimedRewardKeys(): Promise<string[]> {
    const claim = await this.readClaimPlaceholder();
    return claim.claimedRewardKeys;
  }

  async setClaimedRewardKeys(keys: string[]): Promise<void> {
    await this.writeClaimPlaceholder({
      claimedRewardKeys: keys,
    });
  }

  async readInventory(): Promise<NeuroPassInventory> {
    return this.readTypedPayload(
      storageKeys.neuroPassInventory,
      DEFAULT_NEURO_PASS_INVENTORY,
      normalizeNeuroPassInventory,
    );
  }

  async writeInventory(inventory: NeuroPassInventory): Promise<void> {
    await this.writeTypedPayload(
      storageKeys.neuroPassInventory,
      normalizeNeuroPassInventory(inventory),
    );
  }

  async applyRewardToInventory(reward: NeuroPassReward): Promise<NeuroPassInventory> {
    const current = await this.readInventory();
    const next = applyNeuroPassInventoryReward(current, reward);
    await this.writeInventory(next);
    return next;
  }

  async applyCurrencyDeltaToInventory(delta: NeuroPassInventoryCurrencyDelta): Promise<NeuroPassInventory> {
    const coins = Math.max(0, Math.floor(delta.coins ?? 0));
    const trackFragments = Math.max(0, Math.floor(delta.trackFragments ?? 0));
    if (coins <= 0 && trackFragments <= 0) {
      return this.readInventory();
    }

    const current = await this.readInventory();
    const next = applyNeuroPassInventoryCurrencyDelta(current, {
      coins,
      trackFragments,
    });

    await this.writeInventory(next);
    return next;
  }

  async getXpGrants(): Promise<NeuroPassXpGrant[]> {
    const grants = await this.readTypedPayload(
      storageKeys.neuroPassXpGrants,
      DEFAULT_XP_GRANTS,
      normalizeXpGrants,
    );
    return [...grants];
  }

  async appendXpGrant(grant: NeuroPassXpGrant): Promise<void> {
    const grants = await this.getXpGrants();
    grants.push(normalizeXpGrant(grant));
    await this.writeTypedPayload(storageKeys.neuroPassXpGrants, grants);
  }

  async replaceXpGrants(grants: NeuroPassXpGrant[]): Promise<void> {
    await this.writeTypedPayload(storageKeys.neuroPassXpGrants, normalizeXpGrants(grants));
  }

  async getSeenRunIds(): Promise<NeuroPassSeenRunIdRecord[]> {
    const records = await this.readTypedPayload(
      storageKeys.neuroPassSeenRunIds,
      DEFAULT_SEEN_RUN_IDS,
      normalizeSeenRunIds,
    );
    return [...records];
  }

  async setSeenRunIds(records: NeuroPassSeenRunIdRecord[]): Promise<void> {
    await this.writeTypedPayload(
      storageKeys.neuroPassSeenRunIds,
      normalizeSeenRunIds(records),
    );
  }

  async readTimeHeuristicState(): Promise<NeuroPassTimeHeuristicState> {
    return this.readTypedPayload(
      storageKeys.neuroPassTimeHeuristicState,
      DEFAULT_TIME_HEURISTIC_STATE,
      normalizeTimeHeuristicState,
    );
  }

  async writeTimeHeuristicState(state: NeuroPassTimeHeuristicState): Promise<void> {
    await this.writeTypedPayload(
      storageKeys.neuroPassTimeHeuristicState,
      normalizeTimeHeuristicState(state),
    );
  }

  async getQuestState(): Promise<NeuroPassQuestsStateBundle | null> {
    const questState = await this.readTypedPayload(
      storageKeys.neuroPassQuests,
      DEFAULT_QUEST_STATE,
      normalizeQuestStateBundle,
    );
    const questKeys = await this.readTypedPayload(
      storageKeys.neuroPassQuestKeys,
      {
        dailyKey: '',
        weeklyKey: '',
      },
      normalizeQuestKeys,
    );

    return {
      ...questState,
      dailyKey: questKeys.dailyKey || questState.dailyKey,
      weeklyKey: questKeys.weeklyKey || questState.weeklyKey,
    };
  }

  async setQuestState(state: NeuroPassQuestsStateBundle): Promise<void> {
    const normalized = normalizeQuestStateBundle(state);
    await this.writeTypedPayload(storageKeys.neuroPassQuests, normalized);
    await this.writeTypedPayload(storageKeys.neuroPassQuestKeys, {
      dailyKey: normalized.dailyKey,
      weeklyKey: normalized.weeklyKey,
    });
  }

  async readLastSeenSeasonId(): Promise<string | null> {
    const value = await this.storage.getString(storageKeys.neuroPassLastSeenSeasonId);
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  async writeLastSeenSeasonId(seasonId: string): Promise<void> {
    await this.storage.setString(storageKeys.neuroPassLastSeenSeasonId, seasonId.trim());
  }

  async readLastAppliedSeasonState(): Promise<NeuroPassSeasonState | null> {
    const value = await this.storage.getString(storageKeys.neuroPassLastAppliedSeasonState);
    if (value === 'preseason' || value === 'active' || value === 'grace' || value === 'ended') {
      return value;
    }

    return null;
  }

  async writeLastAppliedSeasonState(state: NeuroPassSeasonState): Promise<void> {
    await this.storage.setString(storageKeys.neuroPassLastAppliedSeasonState, state);
  }

  async readLastUpsellAtUtc(): Promise<string | null> {
    const value = await this.storage.getString(storageKeys.neuroPassLastUpsellAtUtc);
    if (!value || Number.isNaN(Date.parse(value))) {
      return null;
    }

    return value;
  }

  async writeLastUpsellAtUtc(isoUtc: string): Promise<void> {
    if (Number.isNaN(Date.parse(isoUtc))) {
      return;
    }

    await this.storage.setString(storageKeys.neuroPassLastUpsellAtUtc, isoUtc);
  }

  async resetForDebug(): Promise<void> {
    if (!isDevRuntime()) {
      return;
    }

    await Promise.all([
      this.storage.remove(storageKeys.neuroPassCachedManifest),
      this.storage.remove(storageKeys.neuroPassProgress),
      this.storage.remove(storageKeys.neuroPassEntitlement),
      this.storage.remove(storageKeys.neuroPassClaimPlaceholder),
      this.storage.remove(storageKeys.neuroPassLastSeenSeasonId),
      this.storage.remove(storageKeys.neuroPassLastAppliedSeasonState),
      this.storage.remove(storageKeys.neuroPassLastUpsellAtUtc),
      this.storage.remove(storageKeys.neuroPassXpGrants),
      this.storage.remove(storageKeys.neuroPassSeenRunIds),
      this.storage.remove(storageKeys.neuroPassTimeHeuristicState),
      this.storage.remove(storageKeys.neuroPassIapRecords),
      this.storage.remove(storageKeys.neuroPassQuests),
      this.storage.remove(storageKeys.neuroPassQuestKeys),
      this.storage.remove(storageKeys.neuroPassInventory),
    ]);
  }

  private async readTypedPayload<T>(
    key: string,
    fallback: T,
    normalize: (value: unknown) => T,
  ): Promise<T> {
    const raw = await this.storage.getString(key);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedPayload<unknown>;
      if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
        return fallback;
      }

      return normalize(parsed.data);
    } catch {
      return fallback;
    }
  }

  private async writeTypedPayload<T>(key: string, data: T): Promise<void> {
    const payload: PersistedPayload<T> = {
      schemaVersion: SCHEMA_VERSION,
      data,
    };

    await this.storage.setString(key, JSON.stringify(payload));
  }
}

function isDevRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }

  return process.env.NODE_ENV !== 'production';
}

function normalizeProgress(value: unknown): NeuroPassPersistedProgressModel {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PROGRESS;
  }

  const record = value as Record<string, unknown>;
  const currentNxp = Number(record.currentNxp);
  const lastUpdatedAtUtc =
    typeof record.lastUpdatedAtUtc === 'string' && !Number.isNaN(new Date(record.lastUpdatedAtUtc).getTime())
      ? record.lastUpdatedAtUtc
      : DEFAULT_PROGRESS.lastUpdatedAtUtc;

  return {
    currentNxp: Number.isFinite(currentNxp) ? Math.max(0, Math.floor(currentNxp)) : 0,
    lastUpdatedAtUtc,
  };
}

function normalizeEntitlement(value: unknown): NeuroPassPersistedEntitlementModel {
  if (!value || typeof value !== 'object') {
    return DEFAULT_ENTITLEMENT;
  }

  const record = value as Record<string, unknown>;
  const seasonId = typeof record.seasonId === 'string' && record.seasonId.trim().length > 0
    ? record.seasonId.trim().slice(0, 64)
    : DEFAULT_ENTITLEMENT.seasonId;
  const premiumOwned = Boolean(record.premiumOwned);
  const passSkuPurchased = record.passSkuPurchased === 'plus' || record.passSkuPurchased === 'standard'
    ? record.passSkuPurchased
    : null;
  const plusTierSkipsRemaining = Number(record.plusTierSkipsRemaining);
  const purchasedTierSkipsBalance = Number(record.purchasedTierSkipsBalance);
  const tierSkipsPurchasedTodayCount = Number(record.tierSkipsPurchasedTodayCount);
  const bonusUnlockedTiers = Number(record.bonusUnlockedTiers);
  const lastPurchaseAtUtc = asIsoOrUndefined(record.lastPurchaseAtUtc);
  const lastRestoreAtUtc = asIsoOrUndefined(record.lastRestoreAtUtc);
  const purchasedSkus = Array.isArray(record.purchasedSkus)
    ? record.purchasedSkus.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(-30)
    : [];

  return {
    seasonId,
    premiumOwned,
    passSkuPurchased,
    plusTierSkipsRemaining: Number.isFinite(plusTierSkipsRemaining)
      ? Math.max(0, Math.floor(plusTierSkipsRemaining))
      : 0,
    purchasedTierSkipsBalance: Number.isFinite(purchasedTierSkipsBalance)
      ? Math.max(0, Math.floor(purchasedTierSkipsBalance))
      : 0,
    tierSkipsPurchasedTodayCount: Number.isFinite(tierSkipsPurchasedTodayCount)
      ? Math.max(0, Math.floor(tierSkipsPurchasedTodayCount))
      : 0,
    bonusUnlockedTiers: Number.isFinite(bonusUnlockedTiers)
      ? Math.max(0, Math.floor(bonusUnlockedTiers))
      : 0,
    lastPurchaseAtUtc,
    lastRestoreAtUtc,
    purchasedSkus,
  };
}

function normalizeClaimPlaceholder(value: unknown): NeuroPassClaimPlaceholderModel {
  if (!value || typeof value !== 'object') {
    return DEFAULT_CLAIM_PLACEHOLDER;
  }

  const record = value as Record<string, unknown>;
  const claimedRewardKeys = Array.isArray(record.claimedRewardKeys)
    ? record.claimedRewardKeys
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .slice(0, 400)
    : [];

  return {
    claimedRewardKeys,
  };
}

function normalizeXpGrants(value: unknown): NeuroPassXpGrant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeXpGrant(item))
    .filter((item) => item.id.length > 0)
    .slice(-2500);
}

function normalizeXpGrant(value: unknown): NeuroPassXpGrant {
  if (!value || typeof value !== 'object') {
    return {
      id: '',
      source: 'run',
      amount: 0,
      createdAtUtc: new Date(0).toISOString(),
    };
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim().slice(0, 80) : '';
  const source = record.source === 'dailyQuest'
    || record.source === 'weeklyQuest'
    || record.source === 'bossWeekly'
    ? record.source
    : 'run';
  const amountRaw = Number(record.amount);
  const amount = Number.isFinite(amountRaw) ? Math.max(0, Math.floor(amountRaw)) : 0;
  const createdAtUtc =
    typeof record.createdAtUtc === 'string' && !Number.isNaN(Date.parse(record.createdAtUtc))
      ? record.createdAtUtc
      : new Date(0).toISOString();

  const meta = normalizeXpGrantMeta(record.meta);

  return {
    id,
    source,
    amount,
    createdAtUtc,
    meta,
  };
}

function normalizeSeenRunIds(value: unknown): NeuroPassSeenRunIdRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const dedupe = new Set<string>();
  const records: NeuroPassSeenRunIdRecord[] = [];

  value.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const record = entry as Record<string, unknown>;
    const runId = typeof record.runId === 'string' ? record.runId.trim().slice(0, 96) : '';
    const createdAtUtc =
      typeof record.createdAtUtc === 'string' && !Number.isNaN(Date.parse(record.createdAtUtc))
        ? record.createdAtUtc
        : undefined;

    if (!runId || !createdAtUtc || dedupe.has(runId)) {
      return;
    }

    dedupe.add(runId);
    records.push({
      runId,
      createdAtUtc,
    });
  });

  return records.slice(-5000);
}

function normalizeTimeHeuristicState(value: unknown): NeuroPassTimeHeuristicState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_TIME_HEURISTIC_STATE;
  }

  const record = value as Record<string, unknown>;
  const stableSamples = Number(record.stableSamples);
  const lastSeenMonotonicMs = Number(record.lastSeenMonotonicMs);
  const lastDeltaMs = Number(record.lastDeltaMs);

  return {
    lastSeenWallClockUtc:
      typeof record.lastSeenWallClockUtc === 'string'
      && !Number.isNaN(Date.parse(record.lastSeenWallClockUtc))
        ? record.lastSeenWallClockUtc
        : undefined,
    lastSeenMonotonicMs:
      Number.isFinite(lastSeenMonotonicMs) && lastSeenMonotonicMs >= 0
        ? lastSeenMonotonicMs
        : undefined,
    suspiciousTime: Boolean(record.suspiciousTime),
    stableSamples: Number.isFinite(stableSamples) ? Math.max(0, Math.floor(stableSamples)) : 0,
    lastDeltaMs: Number.isFinite(lastDeltaMs) ? lastDeltaMs : undefined,
  };
}

function normalizeXpGrantMeta(value: unknown): NeuroPassXpGrant['meta'] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const grade = record.grade;
  const capState = record.capState;
  const dayKeyUtc = typeof record.dayKeyUtc === 'string' ? record.dayKeyUtc.slice(0, 8) : undefined;
  const questId = typeof record.questId === 'string' ? record.questId.slice(0, 40) : undefined;

  return {
    grade: grade === 'C' || grade === 'B' || grade === 'A' || grade === 'S' ? grade : undefined,
    softCapped: typeof record.softCapped === 'boolean' ? record.softCapped : undefined,
    hardCapped: typeof record.hardCapped === 'boolean' ? record.hardCapped : undefined,
    runAccuracy: toBoundedNumber(record.runAccuracy, 0, 1),
    rhythmBonus: toBoundedNumber(record.rhythmBonus, 0, 40),
    comboBonus: toBoundedNumber(record.comboBonus, 0, 25),
    phaseDiversityBonus: toBoundedNumber(record.phaseDiversityBonus, 0, 10),
    antiSpamPenalty: toBoundedNumber(record.antiSpamPenalty, 0, 60),
    capState: capState === 'none' || capState === 'soft' || capState === 'hard' ? capState : undefined,
    dayKeyUtc,
    questId,
  };
}

function toBoundedNumber(value: unknown, min: number, max: number): number | undefined {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizeQuestKeys(value: unknown): { dailyKey: string; weeklyKey: string } {
  if (!value || typeof value !== 'object') {
    return {
      dailyKey: '',
      weeklyKey: '',
    };
  }

  const record = value as Record<string, unknown>;
  const dailyKey = typeof record.dailyKey === 'string' && /^\d{8}$/.test(record.dailyKey)
    ? record.dailyKey
    : '';
  const weeklyKey = typeof record.weeklyKey === 'string' && /^\d{8}$/.test(record.weeklyKey)
    ? record.weeklyKey
    : '';

  return {
    dailyKey,
    weeklyKey,
  };
}

function normalizeQuestStateBundle(value: unknown): NeuroPassQuestsStateBundle {
  if (!value || typeof value !== 'object') {
    return DEFAULT_QUEST_STATE;
  }

  const record = value as Record<string, unknown>;
  const seasonId = typeof record.seasonId === 'string'
    ? record.seasonId.trim().slice(0, 64)
    : '';
  const dailyKey = typeof record.dailyKey === 'string' && /^\d{8}$/.test(record.dailyKey)
    ? record.dailyKey
    : '';
  const weeklyKey = typeof record.weeklyKey === 'string' && /^\d{8}$/.test(record.weeklyKey)
    ? record.weeklyKey
    : '';
  const daily = normalizeQuestStates(record.daily, 'daily', dailyKey, 3);
  const weekly = normalizeQuestStates(record.weekly, 'weekly', weeklyKey, 5);
  const bossWeekly = normalizeBossQuestState(record.bossWeekly, weeklyKey);

  return {
    seasonId,
    dailyKey,
    weeklyKey,
    daily,
    weekly,
    bossWeekly,
  };
}

function normalizeQuestStates(
  value: unknown,
  period: 'daily' | 'weekly',
  periodKey: string,
  maxLength: number,
): NeuroPassQuestState[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeQuestState(item))
    .filter((item) =>
      item.period === period
      && item.periodKey === periodKey
      && item.questId.length > 0,
    )
    .slice(0, maxLength);
}

function normalizeBossQuestState(value: unknown, weeklyKey: string): NeuroPassQuestState | null {
  const normalized = normalizeQuestState(value);
  if (
    normalized.period !== 'bossWeekly'
    || normalized.periodKey !== weeklyKey
    || normalized.questId.length === 0
  ) {
    return null;
  }

  return normalized;
}

function normalizeQuestState(value: unknown): NeuroPassQuestState {
  if (!value || typeof value !== 'object') {
    return {
      questId: '',
      period: 'daily',
      periodKey: '',
      type: 'complete_runs',
      title: '',
      description: '',
      progress: 0,
      target: 1,
      progressUnit: 'count',
      rewardNxp: 0,
      status: 'active',
    };
  }

  const record = value as Record<string, unknown>;
  const period = record.period === 'weekly' || record.period === 'bossWeekly'
    ? record.period
    : 'daily';
  const status = record.status === 'completed' || record.status === 'claimed'
    ? record.status
    : 'active';
  const progressUnit =
    record.progressUnit === 'percent'
    || record.progressUnit === 'ms'
    || record.progressUnit === 'points'
      ? record.progressUnit
      : 'count';
  const type = typeof record.type === 'string' && record.type.trim().length > 0
    ? record.type.trim().slice(0, 40)
    : 'complete_runs';
  const difficultyTag = record.difficultyTag === 'easy'
    || record.difficultyTag === 'med'
    || record.difficultyTag === 'hard'
    ? record.difficultyTag
    : undefined;

  return {
    questId: typeof record.questId === 'string' ? record.questId.trim().slice(0, 64) : '',
    period,
    periodKey:
      typeof record.periodKey === 'string' && /^\d{8}$/.test(record.periodKey)
        ? record.periodKey
        : '',
    type: type as NeuroPassQuestState['type'],
    title: typeof record.title === 'string' ? record.title.slice(0, 80) : '',
    description: typeof record.description === 'string' ? record.description.slice(0, 140) : '',
    progress: Math.max(0, Math.floor(Number(record.progress) || 0)),
    target: Math.max(1, Math.floor(Number(record.target) || 1)),
    progressUnit,
    rewardNxp: Math.max(0, Math.floor(Number(record.rewardNxp) || 0)),
    status,
    difficultyTag,
    claimedAtUtc: asIsoOrUndefined(record.claimedAtUtc),
    completedAtUtc: asIsoOrUndefined(record.completedAtUtc),
  };
}

function entitlementStorageKey(seasonId: string): string {
  const token = sanitizeToken(seasonId);
  return `${storageKeys.neuroPassEntitlementPrefix}_${token}.v1`;
}

function tierSkipDayStorageKey(dayKey: string): string {
  const token = sanitizeToken(dayKey);
  return `${storageKeys.neuroPassTierSkipDayPrefix}_${token}.v1`;
}

function sanitizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64) || 'default';
}

function toDomainEntitlement(
  entitlement: NeuroPassPersistedEntitlementModel,
  seasonId: string,
): NeuroPassEntitlement {
  return {
    ...buildDefaultNeuroPassEntitlement(seasonId),
    seasonId,
    premiumOwned: Boolean(entitlement.premiumOwned),
    passSkuPurchased:
      entitlement.passSkuPurchased === 'plus' || entitlement.passSkuPurchased === 'standard'
        ? entitlement.passSkuPurchased
        : null,
    plusTierSkipsRemaining: Math.max(0, Math.floor(entitlement.plusTierSkipsRemaining)),
    purchasedTierSkipsBalance: Math.max(0, Math.floor(entitlement.purchasedTierSkipsBalance ?? 0)),
    tierSkipsPurchasedTodayCount: Math.max(
      0,
      Math.floor(entitlement.tierSkipsPurchasedTodayCount ?? 0),
    ),
    bonusUnlockedTiers: Math.max(0, Math.floor(entitlement.bonusUnlockedTiers ?? 0)),
    lastPurchaseAtUtc: asIsoOrUndefined(entitlement.lastPurchaseAtUtc),
    lastRestoreAtUtc: asIsoOrUndefined(entitlement.lastRestoreAtUtc),
    purchasedSkus: Array.isArray(entitlement.purchasedSkus)
      ? entitlement.purchasedSkus.filter((item) => typeof item === 'string' && item.trim().length > 0)
      : [],
  };
}

function normalizeIapPurchaseRecords(value: unknown): NeuroPassIapPurchaseRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((record) => normalizeIapPurchaseRecord(record))
    .filter((record) => record.transactionId.length > 0 || record.purchaseToken.length > 0)
    .slice(-400);
}

function normalizeIapPurchaseRecord(value: unknown): NeuroPassIapPurchaseRecord {
  if (!value || typeof value !== 'object') {
    return {
      transactionId: '',
      purchaseToken: '',
      sku: '',
      seasonId: '',
      grantedAtUtc: new Date(0).toISOString(),
    };
  }

  const record = value as Record<string, unknown>;
  return {
    transactionId: typeof record.transactionId === 'string' ? record.transactionId.trim().slice(0, 120) : '',
    purchaseToken: typeof record.purchaseToken === 'string' ? record.purchaseToken.trim().slice(0, 180) : '',
    sku: typeof record.sku === 'string' ? record.sku.trim().slice(0, 80) : '',
    seasonId: typeof record.seasonId === 'string' ? record.seasonId.trim().slice(0, 64) : '',
    grantedAtUtc: asIsoOrUndefined(record.grantedAtUtc) ?? new Date(0).toISOString(),
  };
}

function asIsoOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return Number.isNaN(Date.parse(value)) ? undefined : value;
}
