import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { NoopAnalyticsClient } from '@core/analytics/AnalyticsClient';
import { AnalyticsService } from '@core/analytics/AnalyticsService';

export function registerAnalyticsModule(container: Container): void {
  container.registerSingleton(TOKENS.analyticsClient, () => new NoopAnalyticsClient());
  container.registerSingleton(TOKENS.analyticsService, (c) => new AnalyticsService(c.resolve(TOKENS.analyticsClient)));
}
