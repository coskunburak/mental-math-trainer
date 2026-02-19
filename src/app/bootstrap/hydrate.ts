import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';

export async function hydrateApp(container: Container): Promise<void> {
  const bootstrapState = container.resolve(TOKENS.bootstrapState);
  const gameProgressStore = container.resolve(TOKENS.gameProgressStore);

  try {
    bootstrapState.initialGameProgress = await gameProgressStore.load();
  } catch {
    bootstrapState.initialGameProgress = null;
  }
}
