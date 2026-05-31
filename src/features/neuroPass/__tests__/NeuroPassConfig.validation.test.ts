import { DEFAULT_NEURO_PASS_CONFIG, sanitizeNeuroPassConfig } from '@features/neuroPass/domain/config/NeuroPassConfig';

describe('NeuroPass config validation', () => {
  it('clamps out-of-range values and reports issues', () => {
    const { config, issues } = sanitizeNeuroPassConfig({
      softCapThreshold: 8000,
      hardCapThreshold: -5,
      softCapMultiplier: 2.5,
      rhythmBonusWeight: -1,
      comboBonusWeight: 9,
      antiSpamScale: 5,
      manifestOverrideVersion: -10,
      manifestOverrideKey: '  season_manifest_v3  ',
    });

    expect(config.softCapThreshold).toBe(5000);
    expect(config.hardCapThreshold).toBe(5000);
    expect(config.softCapMultiplier).toBe(1);
    expect(config.rhythmBonusWeight).toBe(0);
    expect(config.comboBonusWeight).toBe(2);
    expect(config.antiSpamScale).toBe(2);
    expect(config.manifestOverrideVersion).toBe(0);
    expect(config.manifestOverrideKey).toBe('season_manifest_v3');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('falls back to defaults for invalid numeric inputs', () => {
    const { config } = sanitizeNeuroPassConfig(
      {
        softCapThreshold: Number.NaN,
        hardCapThreshold: Number.POSITIVE_INFINITY,
      },
      DEFAULT_NEURO_PASS_CONFIG,
    );

    expect(config.softCapThreshold).toBe(DEFAULT_NEURO_PASS_CONFIG.softCapThreshold);
    expect(config.hardCapThreshold).toBe(DEFAULT_NEURO_PASS_CONFIG.hardCapThreshold);
  });
});
