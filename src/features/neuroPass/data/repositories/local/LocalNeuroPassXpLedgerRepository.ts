import {
  type NeuroPassSeenRunIdRecord,
  NeuroPassLocalStore,
} from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { NeuroPassXpGrant } from '@features/neuroPass/domain/entities/NeuroPassXpGrant';
import type { NeuroPassXpLedgerRepository } from '@features/neuroPass/domain/repositories/NeuroPassXpLedgerRepository';
import type { NeuroPassXpSource } from '@features/neuroPass/domain/types/NeuroPassXpSource';
import { getTodayUtcRange, isInUtcRange } from '@features/neuroPass/domain/utils/time';

const DAY_MS = 24 * 60 * 60 * 1000;
const XP_LEDGER_KEEP_DAYS = 90;

export class LocalNeuroPassXpLedgerRepository implements NeuroPassXpLedgerRepository {
  private seenRunIdCache: Set<string> | null = null;
  private seenRunIndexReady = false;

  constructor(
    private readonly localStore: NeuroPassLocalStore,
    private readonly now: () => number = () => Date.now(),
    private readonly replayLookbackDays = 45,
  ) {
    scheduleBackgroundTask(() => {
      void this.ensureSeenRunIndexLoaded(false);
    });
  }

  async hasGrant(id: string, source: NeuroPassXpSource): Promise<boolean> {
    const normalizedId = normalizeId(id);
    if (normalizedId.length === 0) {
      return false;
    }

    if (source === 'run' && await this.hasSeenRunId(normalizedId)) {
      return true;
    }

    const grants = await this.localStore.getXpGrants();
    return grants.some((grant) => grant.id === normalizedId && grant.source === source);
  }

  async hasSeenRunId(runId: string): Promise<boolean> {
    const normalized = normalizeId(runId);
    if (normalized.length === 0) {
      return false;
    }

    await this.ensureSeenRunIndexLoaded(false);
    return this.seenRunIdCache?.has(normalized) ?? false;
  }

  async rebuildSeenRunIdsIndex(force = false): Promise<number> {
    await this.ensureSeenRunIndexLoaded(force);
    return this.seenRunIdCache?.size ?? 0;
  }

  async getTodayRunTotal(nowUtc: Date): Promise<number> {
    const range = getTodayUtcRange(nowUtc);
    const grants = await this.localStore.getXpGrants();

    return grants.reduce((sum, grant) => {
      if (grant.source !== 'run') {
        return sum;
      }

      if (!isInUtcRange(grant.createdAtUtc, range)) {
        return sum;
      }

      return sum + Math.max(0, Math.floor(grant.amount));
    }, 0);
  }

  async getTodayTotalNxp(nowUtc: Date): Promise<number> {
    const range = getTodayUtcRange(nowUtc);
    const grants = await this.localStore.getXpGrants();

    return grants.reduce((sum, grant) => {
      if (!isInUtcRange(grant.createdAtUtc, range)) {
        return sum;
      }

      return sum + Math.max(0, Math.floor(grant.amount));
    }, 0);
  }

  async append(grant: NeuroPassXpGrant): Promise<void> {
    await this.localStore.appendXpGrant(grant);

    if (grant.source === 'run') {
      await this.rememberSeenRunId(grant.id, grant.createdAtUtc);
    }

    scheduleBackgroundTask(() => {
      void this.compactIfNeeded();
    });
  }

  async listTodayGrants(nowUtc: Date): Promise<NeuroPassXpGrant[]> {
    const range = getTodayUtcRange(nowUtc);
    const grants = await this.localStore.getXpGrants();

    return grants.filter((grant) => isInUtcRange(grant.createdAtUtc, range));
  }

  async listAll(): Promise<NeuroPassXpGrant[]> {
    return this.localStore.getXpGrants();
  }

  private async ensureSeenRunIndexLoaded(force: boolean): Promise<void> {
    if (this.seenRunIndexReady && !force) {
      return;
    }

    const cutoffMs = this.now() - Math.max(1, this.replayLookbackDays) * DAY_MS;
    const existing = await this.localStore.getSeenRunIds();
    const recentExisting = existing.filter((entry) => Date.parse(entry.createdAtUtc) >= cutoffMs);

    if (recentExisting.length > 0 && !force) {
      this.seenRunIdCache = new Set(recentExisting.map((entry) => entry.runId));
      this.seenRunIndexReady = true;
      if (recentExisting.length !== existing.length) {
        await this.localStore.setSeenRunIds(recentExisting);
      }
      return;
    }

    const grants = await this.localStore.getXpGrants();
    const rebuilt = buildSeenRunIdRecordsFromGrants(grants, cutoffMs);
    await this.localStore.setSeenRunIds(rebuilt);

    this.seenRunIdCache = new Set(rebuilt.map((entry) => entry.runId));
    this.seenRunIndexReady = true;
  }

  private async rememberSeenRunId(runId: string, createdAtUtc: string): Promise<void> {
    const normalizedRunId = normalizeId(runId);
    if (!normalizedRunId) {
      return;
    }

    await this.ensureSeenRunIndexLoaded(false);

    if (!this.seenRunIdCache) {
      this.seenRunIdCache = new Set();
    }

    if (this.seenRunIdCache.has(normalizedRunId)) {
      return;
    }

    this.seenRunIdCache.add(normalizedRunId);

    const records = await this.localStore.getSeenRunIds();
    records.push({
      runId: normalizedRunId,
      createdAtUtc: Number.isFinite(Date.parse(createdAtUtc))
        ? createdAtUtc
        : new Date(this.now()).toISOString(),
    });

    const cutoffMs = this.now() - Math.max(1, this.replayLookbackDays) * DAY_MS;
    const compacted = records
      .filter((entry) => {
        const entryMs = Date.parse(entry.createdAtUtc);
        return Number.isFinite(entryMs) && entryMs >= cutoffMs;
      })
      .slice(-5000);

    await this.localStore.setSeenRunIds(compacted);
    this.seenRunIdCache = new Set(compacted.map((entry) => entry.runId));
  }

  private async compactIfNeeded(): Promise<void> {
    const grants = await this.localStore.getXpGrants();
    if (grants.length < 300) {
      return;
    }

    const cutoffMs = this.now() - XP_LEDGER_KEEP_DAYS * DAY_MS;
    const compacted = grants
      .filter((grant) => {
        const grantMs = Date.parse(grant.createdAtUtc);
        return Number.isFinite(grantMs) && grantMs >= cutoffMs;
      })
      .slice(-1800);

    if (compacted.length !== grants.length) {
      await this.localStore.replaceXpGrants(compacted);
      await this.ensureSeenRunIndexLoaded(true);
    }
  }
}

function buildSeenRunIdRecordsFromGrants(
  grants: NeuroPassXpGrant[],
  cutoffMs: number,
): NeuroPassSeenRunIdRecord[] {
  const dedupe = new Set<string>();

  return grants
    .filter((grant) => grant.source === 'run')
    .map((grant) => ({
      runId: normalizeId(grant.id),
      createdAtUtc: grant.createdAtUtc,
    }))
    .filter((record) => {
      if (!record.runId || dedupe.has(record.runId)) {
        return false;
      }

      const createdMs = Date.parse(record.createdAtUtc);
      if (!Number.isFinite(createdMs) || createdMs < cutoffMs) {
        return false;
      }

      dedupe.add(record.runId);
      return true;
    })
    .slice(-5000);
}

function normalizeId(value: string): string {
  return value.trim().slice(0, 96);
}

function scheduleBackgroundTask(task: () => void): void {
  const maybeSetImmediate = (globalThis as { setImmediate?: (callback: () => void) => void }).setImmediate;
  if (typeof maybeSetImmediate === 'function') {
    maybeSetImmediate(task);
    return;
  }

  setTimeout(task, 0);
}
