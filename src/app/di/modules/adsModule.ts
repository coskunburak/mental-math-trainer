import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { NoopRewardedAdClient } from '@core/ads/RewardedAdClient';
import { RewardedAdService } from '@core/ads/RewardedAdService';

export function registerAdsModule(container: Container): void {
  container.registerSingleton(TOKENS.rewardedAdClient, () => new NoopRewardedAdClient());
  container.registerSingleton(
    TOKENS.rewardedAdService,
    (c) => new RewardedAdService(c.resolve(TOKENS.rewardedAdClient)),
  );
}
