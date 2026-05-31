import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';
import type { NeuroPassConfig } from '@features/neuroPass/domain/config/NeuroPassConfig';

export class ConfigRepositoryImpl implements NeuroPassConfigProvider {
  constructor(
    private readonly primary: NeuroPassConfigProvider,
    private readonly fallback: NeuroPassConfigProvider,
  ) {}

  getConfig(): NeuroPassConfig {
    try {
      return this.primary.getConfig();
    } catch {
      return this.fallback.getConfig();
    }
  }
}
