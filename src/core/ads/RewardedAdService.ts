import type { RewardedAdClient } from './RewardedAdClient';

export class RewardedAdService {
  constructor(private readonly client: RewardedAdClient) {}

  show(placement: string): Promise<boolean> {
    return this.client.showRewardedAd(placement);
  }
}
