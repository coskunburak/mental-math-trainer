import type { Container } from '@app/di/container';
import {
  registerNeuroPassModule,
  type RegisterNeuroPassModuleOptions,
} from '@app/di/modules/neuroPassModule';

export function registerNeuroPass(
  container: Container,
  options?: RegisterNeuroPassModuleOptions,
): void {
  registerNeuroPassModule(container, options);
}
