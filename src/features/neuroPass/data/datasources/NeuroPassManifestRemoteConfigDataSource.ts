import { remoteConfigKeys } from '@core/remoteConfig/keys';
import { RemoteConfigService } from '@core/remoteConfig/RemoteConfigService';
import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';

export class NeuroPassManifestRemoteConfigDataSource {
  constructor(
    private readonly remoteConfigService: RemoteConfigService,
    private readonly configProvider: NeuroPassConfigProvider,
  ) {}

  async loadManifestJson(): Promise<string | null> {
    const enabled = this.remoteConfigService.getBoolean(remoteConfigKeys.neuroPassManifestEnabled);
    if (!enabled) {
      return null;
    }

    const config = this.configProvider.getConfig();
    const candidates: string[] = [];

    const overrideKey = config.manifestOverrideKey.trim();
    if (overrideKey.length > 0) {
      const rawOverride = this.remoteConfigService.getString(overrideKey).trim();
      if (rawOverride.length > 0) {
        candidates.push(rawOverride);
      }
    }

    const rawDefault = this.remoteConfigService.getString(remoteConfigKeys.neuroPassManifestJson).trim();
    if (rawDefault.length > 0) {
      candidates.push(rawDefault);
    }

    const overrideVersion = Math.max(0, Math.floor(config.manifestOverrideVersion));
    for (const candidate of candidates) {
      if (overrideVersion <= 0) {
        return candidate;
      }

      const version = tryExtractManifestVersion(candidate);
      if (version === overrideVersion) {
        return candidate;
      }

      if (isDevRuntime()) {
        // eslint-disable-next-line no-console
        console.warn('[NeuroPass][Manifest] skipping remote manifest due to override version mismatch', {
          overrideVersion,
          candidateVersion: version,
        });
      }
    }

    return null;
  }
}

function tryExtractManifestVersion(rawJson: string): number {
  try {
    const parsed = JSON.parse(rawJson) as { manifestVersion?: unknown };
    const value = Number(parsed.manifestVersion);
    return Number.isFinite(value) ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function isDevRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }

  return process.env.NODE_ENV !== 'production';
}
