import type { NeuroPassConfig } from './NeuroPassConfig';

export interface NeuroPassConfigProvider {
  getConfig(): NeuroPassConfig;
}
