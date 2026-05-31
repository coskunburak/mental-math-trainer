import type { NeuroPassReward } from './NeuroPassReward';

export interface NeuroPassInventory {
  coins: number;
  trackFragments: number;
  musicTrackIds: string[];
  puzzlePackIds: string[];
  bossThemeIds: string[];
  badgeIds: string[];
  metronomeSkinIds: string[];
  profileFrameIds: string[];
  lastUpdatedAtUtc: string;
}

export interface NeuroPassInventoryCurrencyDelta {
  coins?: number;
  trackFragments?: number;
}

export const DEFAULT_NEURO_PASS_INVENTORY: NeuroPassInventory = {
  coins: 0,
  trackFragments: 0,
  musicTrackIds: [],
  puzzlePackIds: [],
  bossThemeIds: [],
  badgeIds: [],
  metronomeSkinIds: [],
  profileFrameIds: [],
  lastUpdatedAtUtc: new Date(0).toISOString(),
};

export function normalizeNeuroPassInventory(value: unknown): NeuroPassInventory {
  if (!value || typeof value !== 'object') {
    return DEFAULT_NEURO_PASS_INVENTORY;
  }

  const record = value as Record<string, unknown>;
  const coins = Number(record.coins);
  const trackFragments = Number(record.trackFragments);

  return {
    coins: Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : 0,
    trackFragments: Number.isFinite(trackFragments) ? Math.max(0, Math.floor(trackFragments)) : 0,
    musicTrackIds: normalizeIdList(record.musicTrackIds, 200),
    puzzlePackIds: normalizeIdList(record.puzzlePackIds, 200),
    bossThemeIds: normalizeIdList(record.bossThemeIds, 100),
    badgeIds: normalizeIdList(record.badgeIds, 200),
    metronomeSkinIds: normalizeIdList(record.metronomeSkinIds, 200),
    profileFrameIds: normalizeIdList(record.profileFrameIds, 100),
    lastUpdatedAtUtc:
      typeof record.lastUpdatedAtUtc === 'string' && !Number.isNaN(Date.parse(record.lastUpdatedAtUtc))
        ? record.lastUpdatedAtUtc
        : DEFAULT_NEURO_PASS_INVENTORY.lastUpdatedAtUtc,
  };
}

export function applyNeuroPassInventoryReward(
  inventory: NeuroPassInventory,
  reward: NeuroPassReward,
  nowIso: string = new Date().toISOString(),
): NeuroPassInventory {
  const normalized = normalizeNeuroPassInventory(inventory);
  const amount = Math.max(0, Math.floor(reward.amount));
  const contentId = reward.contentId.trim();

  if (reward.type === 'coins') {
    return {
      ...normalized,
      coins: normalized.coins + amount,
      lastUpdatedAtUtc: nowIso,
    };
  }

  if (reward.type === 'track_fragment') {
    return {
      ...normalized,
      trackFragments: normalized.trackFragments + amount,
      lastUpdatedAtUtc: nowIso,
    };
  }

  if (contentId.length === 0) {
    return {
      ...normalized,
      lastUpdatedAtUtc: nowIso,
    };
  }

  switch (reward.type) {
    case 'music_track':
      return {
        ...normalized,
        musicTrackIds: appendUniqueId(normalized.musicTrackIds, contentId, 200),
        lastUpdatedAtUtc: nowIso,
      };
    case 'puzzle_pack':
      return {
        ...normalized,
        puzzlePackIds: appendUniqueId(normalized.puzzlePackIds, contentId, 200),
        lastUpdatedAtUtc: nowIso,
      };
    case 'boss_theme':
      return {
        ...normalized,
        bossThemeIds: appendUniqueId(normalized.bossThemeIds, contentId, 100),
        lastUpdatedAtUtc: nowIso,
      };
    case 'badge':
      return {
        ...normalized,
        badgeIds: appendUniqueId(normalized.badgeIds, contentId, 200),
        lastUpdatedAtUtc: nowIso,
      };
    case 'metronome_skin':
      return {
        ...normalized,
        metronomeSkinIds: appendUniqueId(normalized.metronomeSkinIds, contentId, 200),
        lastUpdatedAtUtc: nowIso,
      };
    case 'profile_frame':
      return {
        ...normalized,
        profileFrameIds: appendUniqueId(normalized.profileFrameIds, contentId, 100),
        lastUpdatedAtUtc: nowIso,
      };
    default:
      return {
        ...normalized,
        lastUpdatedAtUtc: nowIso,
      };
  }
}

export function applyNeuroPassInventoryCurrencyDelta(
  inventory: NeuroPassInventory,
  delta: NeuroPassInventoryCurrencyDelta,
  nowIso: string = new Date().toISOString(),
): NeuroPassInventory {
  const normalized = normalizeNeuroPassInventory(inventory);
  const coins = Math.max(0, Math.floor(delta.coins ?? 0));
  const trackFragments = Math.max(0, Math.floor(delta.trackFragments ?? 0));

  if (coins <= 0 && trackFragments <= 0) {
    return normalized;
  }

  return {
    ...normalized,
    coins: normalized.coins + coins,
    trackFragments: normalized.trackFragments + trackFragments,
    lastUpdatedAtUtc: nowIso,
  };
}

function normalizeIdList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  value.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }

    const normalized = entry.trim().slice(0, 80);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result.slice(-limit);
}

function appendUniqueId(list: string[], id: string, limit: number): string[] {
  if (list.includes(id)) {
    return list;
  }

  return [...list, id].slice(-limit);
}
