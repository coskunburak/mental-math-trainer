export interface NeuroPassClaimsRepository {
  getClaimedRewardKeys(): Promise<string[]>;
  setClaimedRewardKeys(keys: string[]): Promise<void>;
  hasClaimKey(key: string): Promise<boolean>;
  addClaimKey(key: string): Promise<void>;
}
