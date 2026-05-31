import { SeasonManifestValidator } from '@features/neuroPass/domain/services/SeasonManifestValidator';

const validManifest = require('../assets/manifest_default.json');

describe('SeasonManifestValidator', () => {
  it('accepts valid default manifest', () => {
    const validator = new SeasonManifestValidator();
    const result = validator.validate(validManifest);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.tiersTotal).toBe(40);
      expect(result.manifest.freeTrack).toHaveLength(40);
      expect(result.manifest.premiumTrack).toHaveLength(40);
    }
  });

  it('rejects invalid tiers and milestones', () => {
    const validator = new SeasonManifestValidator();
    const broken = {
      ...validManifest,
      freeTrack: validManifest.freeTrack.slice(0, 39),
      milestones: {
        featuredTiers: [{ tier: 5, label: 'x', rewardId: 'r' }],
      },
    };

    const result = validator.validate(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join('|')).toContain('freeTrack must have length 40');
      expect(result.errors.join('|')).toContain('milestone tiers must be exactly 5/10/20/30/40');
    }
  });

  it('rejects invalid date ordering', () => {
    const validator = new SeasonManifestValidator();
    const broken = {
      ...validManifest,
      startAt: '2026-03-01T00:00:00.000Z',
      endAt: '2026-02-01T00:00:00.000Z',
    };

    const result = validator.validate(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join('|')).toContain('date ordering must be startAt < endAt < graceEndAt');
    }
  });
});
