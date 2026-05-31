import {
  NEURO_PASS_MILESTONE_TIERS,
  NEURO_PASS_MIN_SUPPORTED_MANIFEST_VERSION,
  NEURO_PASS_TIERS_TOTAL,
  NEURO_PASS_XP_PER_TIER,
  type NeuroPassManifestModel,
  type NeuroPassRewardSlotModel,
} from '@features/neuroPass/data/models/NeuroPassManifestModel';

export type SeasonManifestValidationResult =
  | { ok: true; manifest: NeuroPassManifestModel }
  | { ok: false; errors: string[] };

export class SeasonManifestValidator {
  validate(input: unknown, options?: { minSupportedVersion?: number }): SeasonManifestValidationResult {
    const minSupported = options?.minSupportedVersion ?? NEURO_PASS_MIN_SUPPORTED_MANIFEST_VERSION;
    const errors: string[] = [];

    if (!isRecord(input)) {
      return { ok: false, errors: ['manifest must be an object'] };
    }

    const manifestVersion = asNumber(input.manifestVersion);
    if (manifestVersion == null) {
      errors.push('manifestVersion is required and must be number');
    } else if (manifestVersion < minSupported) {
      errors.push(`manifestVersion ${manifestVersion} is below minSupportedVersion ${minSupported}`);
    }

    const manifestMinSupportedVersion = asNumber(input.minSupportedVersion);
    if (manifestMinSupportedVersion == null) {
      errors.push('minSupportedVersion is required and must be number');
    } else if (manifestVersion != null && manifestVersion < manifestMinSupportedVersion) {
      errors.push('manifestVersion must be >= minSupportedVersion');
    }

    const seasonId = asNonEmptyString(input.seasonId);
    if (!seasonId) {
      errors.push('seasonId is required');
    }

    const name = asNonEmptyString(input.name);
    if (!name) {
      errors.push('name is required');
    }

    const startAt = asDate(input.startAt);
    const endAt = asDate(input.endAt);
    const graceEndAt = asDate(input.graceEndAt);

    if (!startAt) {
      errors.push('startAt must be a valid ISO date string');
    }

    if (!endAt) {
      errors.push('endAt must be a valid ISO date string');
    }

    if (!graceEndAt) {
      errors.push('graceEndAt must be a valid ISO date string');
    }

    if (startAt && endAt && graceEndAt) {
      if (!(startAt.getTime() < endAt.getTime() && endAt.getTime() < graceEndAt.getTime())) {
        errors.push('date ordering must be startAt < endAt < graceEndAt');
      }
    }

    if (input.tiersTotal !== NEURO_PASS_TIERS_TOTAL) {
      errors.push(`tiersTotal must be ${NEURO_PASS_TIERS_TOTAL}`);
    }

    if (input.xpPerTier !== NEURO_PASS_XP_PER_TIER) {
      errors.push(`xpPerTier must be ${NEURO_PASS_XP_PER_TIER}`);
    }

    const freeTrack = input.freeTrack;
    const premiumTrack = input.premiumTrack;

    if (!Array.isArray(freeTrack) || freeTrack.length !== NEURO_PASS_TIERS_TOTAL) {
      errors.push(`freeTrack must have length ${NEURO_PASS_TIERS_TOTAL}`);
    }

    if (!Array.isArray(premiumTrack) || premiumTrack.length !== NEURO_PASS_TIERS_TOTAL) {
      errors.push(`premiumTrack must have length ${NEURO_PASS_TIERS_TOTAL}`);
    }

    if (Array.isArray(freeTrack)) {
      freeTrack.forEach((slot, index) => validateRewardSlot(slot, `freeTrack[${index}]`, errors));
    }

    if (Array.isArray(premiumTrack)) {
      premiumTrack.forEach((slot, index) => validateRewardSlot(slot, `premiumTrack[${index}]`, errors));
    }

    const milestones = input.milestones;
    if (!isRecord(milestones) || !Array.isArray(milestones.featuredTiers)) {
      errors.push('milestones.featuredTiers must be an array');
    } else {
      const featured = milestones.featuredTiers;
      const featuredTiers = featured
        .map((entry) => (isRecord(entry) ? asNumber(entry.tier) : null))
        .filter((tier): tier is number => tier != null)
        .sort((left, right) => left - right);

      const expected = [...NEURO_PASS_MILESTONE_TIERS];
      const sameLength = featuredTiers.length === expected.length;
      const sameValues = sameLength && featuredTiers.every((tier, index) => tier === expected[index]);
      if (!sameValues) {
        errors.push('milestone tiers must be exactly 5/10/20/30/40');
      }

      featured.forEach((entry, index) => {
        if (!isRecord(entry)) {
          errors.push(`milestones.featuredTiers[${index}] must be object`);
          return;
        }

        if (asNumber(entry.tier) == null) {
          errors.push(`milestones.featuredTiers[${index}].tier must be number`);
        }

        if (!asNonEmptyString(entry.label)) {
          errors.push(`milestones.featuredTiers[${index}].label must be non-empty string`);
        }

        if (!asNonEmptyString(entry.rewardId)) {
          errors.push(`milestones.featuredTiers[${index}].rewardId must be non-empty string`);
        }
      });
    }

    const sku = input.sku;
    if (!isRecord(sku)) {
      errors.push('sku must be an object');
    } else {
      const skuKeys = ['standardSku', 'plusSku', 'tierSkipSku5', 'catchUpBundleSku'] as const;
      skuKeys.forEach((key) => {
        if (!asNonEmptyString(sku[key])) {
          errors.push(`sku.${key} must be non-empty string`);
        }
      });
    }

    const content = input.content;
    if (!isRecord(content)) {
      errors.push('content must be an object');
    } else {
      const contentKeys = [
        'musicTrackIds',
        'puzzlePackIds',
        'bossThemeIds',
        'badgeIds',
        'metronomeSkinIds',
        'profileFrameIds',
      ] as const;

      contentKeys.forEach((key) => {
        if (!Array.isArray(content[key])) {
          errors.push(`content.${key} must be an array`);
          return;
        }

        if (content[key].some((entry) => !asNonEmptyString(entry))) {
          errors.push(`content.${key} must contain only non-empty strings`);
        }
      });
    }

    if (errors.length > 0) {
      return {
        ok: false,
        errors,
      };
    }

    return {
      ok: true,
      manifest: input as unknown as NeuroPassManifestModel,
    };
  }
}

function validateRewardSlot(slot: unknown, path: string, errors: string[]): void {
  if (!isRecord(slot)) {
    errors.push(`${path} must be object`);
    return;
  }

  if (!asNonEmptyString(slot.rewardId)) {
    errors.push(`${path}.rewardId must be non-empty string`);
  }

  if (!asNonEmptyString(slot.rewardType)) {
    errors.push(`${path}.rewardType must be non-empty string`);
  }

  if (!asNonEmptyString(slot.contentId)) {
    errors.push(`${path}.contentId must be non-empty string`);
  }

  if (!asNonEmptyString(slot.title)) {
    errors.push(`${path}.title must be non-empty string`);
  }

  const amount = asNumber(slot.amount);
  if (amount == null || amount < 0) {
    errors.push(`${path}.amount must be a number >= 0`);
  }
}

function asDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function buildManifestValidationSummary(result: SeasonManifestValidationResult): string {
  if (result.ok) {
    return 'ok';
  }

  return result.errors.slice(0, 6).join(' | ').slice(0, 400);
}
