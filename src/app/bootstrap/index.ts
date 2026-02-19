import { Container } from '@app/di/container';

import { hydrateApp } from './hydrate';
import { registerServices } from './registerServices';

export async function bootstrapApp(): Promise<Container> {
  const container = new Container();
  registerServices(container);
  await hydrateApp(container);
  return container;
}
