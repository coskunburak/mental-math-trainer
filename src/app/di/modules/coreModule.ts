import { env } from '@app/config/env';
import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';

export function registerCoreModule(container: Container): void {
  container.registerSingleton(TOKENS.env, () => env);
  container.registerSingleton(TOKENS.bootstrapState, () => ({
    initialGameProgress: null,
  }));
}
