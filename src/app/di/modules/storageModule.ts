import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { createKeyValueStore } from '@core/storage/mmkvStore';

export function registerStorageModule(container: Container): void {
  container.registerSingleton(TOKENS.keyValueStore, () => createKeyValueStore());
}
