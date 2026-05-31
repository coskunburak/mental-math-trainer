import { remoteConfigKeys } from '@core/remoteConfig/keys';
import { RemoteConfigService } from '@core/remoteConfig/RemoteConfigService';
import {
  DEFAULT_NEURO_PASS_CONFIG,
  type NeuroPassConfig,
  sanitizeNeuroPassConfig,
} from '@features/neuroPass/domain/config/NeuroPassConfig';
import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';

export class FirebaseRemoteConfigProvider implements NeuroPassConfigProvider {
  private cached: NeuroPassConfig | null = null;

  constructor(private readonly remoteConfigService: RemoteConfigService) {}

  getConfig(): NeuroPassConfig {
    if (this.cached) {
      return this.cached;
    }

    const raw: Partial<NeuroPassConfig> = {
      softCapThreshold: this.remoteConfigService.getNumber(remoteConfigKeys.neuroPassSoftCapThreshold),
      hardCapThreshold: this.remoteConfigService.getNumber(remoteConfigKeys.neuroPassHardCapThreshold),
      softCapMultiplier: this.remoteConfigService.getNumber(remoteConfigKeys.neuroPassSoftCapMultiplier),
      rhythmBonusWeight: this.remoteConfigService.getNumber(remoteConfigKeys.neuroPassRhythmBonusWeight),
      comboBonusWeight: this.remoteConfigService.getNumber(remoteConfigKeys.neuroPassComboBonusWeight),
      antiSpamScale: this.remoteConfigService.getNumber(remoteConfigKeys.neuroPassAntiSpamScale),
      manifestOverrideVersion: this.remoteConfigService.getNumber(
        remoteConfigKeys.neuroPassManifestOverrideVersion,
      ),
      manifestOverrideKey: this.remoteConfigService
        .getString(remoteConfigKeys.neuroPassManifestOverrideKey)
        .trim(),
    };

    const sanitized = sanitizeNeuroPassConfig(raw, DEFAULT_NEURO_PASS_CONFIG);

    if (isDevRuntime() && sanitized.issues.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('[NeuroPass][RC] invalid config values, falling back to defaults', sanitized.issues);
    }

    this.cached = sanitized.config;
    return this.cached;
  }

  clearCache(): void {
    this.cached = null;
  }
}

function isDevRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }

  return process.env.NODE_ENV !== 'production';
}
