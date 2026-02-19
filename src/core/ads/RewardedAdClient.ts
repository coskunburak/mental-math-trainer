export interface RewardedAdClient {
  showRewardedAd(placement: string): Promise<boolean>;
}

export class NoopRewardedAdClient implements RewardedAdClient {
  async showRewardedAd(_placement: string): Promise<boolean> {
    return true;
  }
}
