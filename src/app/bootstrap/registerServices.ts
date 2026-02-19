import type { Container } from '@app/di/container';
import { registerAdsModule } from '@app/di/modules/adsModule';
import { registerAnalyticsModule } from '@app/di/modules/analyticsModule';
import { registerCoreModule } from '@app/di/modules/coreModule';
import { registerGameModule } from '@app/di/modules/gameModule';
import { registerStorageModule } from '@app/di/modules/storageModule';

export function registerServices(container: Container): void {
  registerCoreModule(container);
  registerAnalyticsModule(container);
  registerAdsModule(container);
  registerStorageModule(container);
  registerGameModule(container);
}
