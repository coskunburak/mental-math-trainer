import {
  DEFAULT_NEURO_PASS_CONFIG,
  type NeuroPassConfig,
  sanitizeNeuroPassConfig,
} from '@features/neuroPass/domain/config/NeuroPassConfig';
import type { NeuroPassConfigProvider } from '@features/neuroPass/domain/config/NeuroPassConfigProvider';

export class LocalConfigProvider implements NeuroPassConfigProvider {
  private config: NeuroPassConfig;

  constructor(initial: Partial<NeuroPassConfig> = {}) {
    this.config = sanitizeNeuroPassConfig(initial, DEFAULT_NEURO_PASS_CONFIG).config;
  }

  getConfig(): NeuroPassConfig {
    return this.config;
  }

  setConfig(partial: Partial<NeuroPassConfig>): void {
    this.config = sanitizeNeuroPassConfig(partial, this.config).config;
  }
}
