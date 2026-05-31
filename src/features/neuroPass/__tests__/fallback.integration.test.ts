import { RemoteConfigService } from '@core/remoteConfig/RemoteConfigService';
import type { RemoteConfigClient } from '@core/remoteConfig/RemoteConfigClient';
import { NeuroPassManifestAssetDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestAssetDataSource';
import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import { NeuroPassManifestRemoteConfigDataSource } from '@features/neuroPass/data/datasources/NeuroPassManifestRemoteConfigDataSource';
import { LocalConfigProvider } from '@features/neuroPass/data/config/LocalConfigProvider';
import { NeuroPassRepositoryImpl } from '@features/neuroPass/data/repositories/NeuroPassRepositoryImpl';
import { SeasonManifestValidator } from '@features/neuroPass/domain/services/SeasonManifestValidator';
import { ApplySeasonTransition } from '@features/neuroPass/domain/usecases/ApplySeasonTransition';
import { LoadNeuroPassDashboard } from '@features/neuroPass/domain/usecases/LoadNeuroPassDashboard';

import { InMemoryKeyValueStore } from './testUtils';

class InvalidManifestRemoteClient implements RemoteConfigClient {
  getString(key: string): string | null {
    if (key === 'neuro_pass_manifest_json') {
      return '{"manifestVersion":"bad"}';
    }

    return null;
  }

  getNumber(_key: string): number | null {
    return null;
  }

  getBoolean(key: string): boolean | null {
    if (key === 'neuro_pass_manifest_enabled') {
      return true;
    }

    return null;
  }
}

describe('NeuroPass fallback integration', () => {
  it('falls back to asset manifest when remote config is invalid', async () => {
    const localStore = new NeuroPassLocalStore(new InMemoryKeyValueStore());
    const remoteConfigService = new RemoteConfigService(new InvalidManifestRemoteClient());
    const repository = new NeuroPassRepositoryImpl(
      new NeuroPassManifestRemoteConfigDataSource(remoteConfigService, new LocalConfigProvider()),
      new NeuroPassManifestAssetDataSource(),
      localStore,
    );

    const usecase = new LoadNeuroPassDashboard(
      repository,
      new SeasonManifestValidator(),
      new ApplySeasonTransition(),
      () => Date.parse('2026-02-12T00:00:00.000Z'),
    );

    const dashboard = await usecase.execute({ strategy: 'remote_first' });

    expect(dashboard.status).toBe('ready');
    expect(dashboard.season?.id).toBe('neuro_pass_s1');

    const cachedRaw = await localStore.readCachedManifest();
    expect(cachedRaw).not.toBeNull();
  });
});
