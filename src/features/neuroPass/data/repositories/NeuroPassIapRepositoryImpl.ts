import { NeuroPassLocalStore } from '@features/neuroPass/data/datasources/NeuroPassLocalStore';
import type { IapClient } from '@features/neuroPass/data/iap/RniapClient';
import type {
  NeuroPassIapProduct,
  NeuroPassIapPurchaseRecord,
  NeuroPassIapRepository,
  NeuroPassIapTransaction,
} from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';
import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';

/**
 * Client-only verification is not secure; server verification is required
 * for robust fraud protection.
 */
export class NeuroPassIapRepositoryImpl implements NeuroPassIapRepository {
  constructor(
    private readonly localStore: NeuroPassLocalStore,
    private readonly iapClient: IapClient,
  ) {}

  async initialize(): Promise<void> {
    await this.iapClient.initialize();
  }

  async listProducts(skus: string[]): Promise<NeuroPassIapProduct[]> {
    return this.iapClient.listProducts(skus);
  }

  async requestPurchase(sku: string): Promise<NeuroPassIapTransaction> {
    return this.iapClient.requestPurchase(sku);
  }

  async restorePurchases(): Promise<NeuroPassIapTransaction[]> {
    return this.iapClient.restorePurchases();
  }

  async finishTransaction(transaction: NeuroPassIapTransaction, consumable: boolean): Promise<void> {
    await this.iapClient.finishTransaction(transaction, consumable);
  }

  async getEntitlement(seasonId: string): Promise<NeuroPassEntitlement> {
    return this.localStore.getEntitlement(seasonId);
  }

  async setEntitlement(seasonId: string, entitlement: NeuroPassEntitlement): Promise<void> {
    await this.localStore.setEntitlement(seasonId, entitlement);
  }

  async getIapPurchaseRecords(): Promise<NeuroPassIapPurchaseRecord[]> {
    return this.localStore.getIapPurchaseRecords();
  }

  async upsertIapPurchaseRecord(record: NeuroPassIapPurchaseRecord): Promise<void> {
    await this.localStore.upsertIapPurchaseRecord(record);
  }

  async getTierSkipDailyCounter(dayKey: string): Promise<number> {
    return this.localStore.getTierSkipDailyCounter(dayKey);
  }

  async setTierSkipDailyCounter(dayKey: string, count: number): Promise<void> {
    await this.localStore.setTierSkipDailyCounter(dayKey, count);
  }

  async getClaimedRewardKeys(): Promise<string[]> {
    return this.localStore.getClaimedRewardKeys();
  }

  async setClaimedRewardKeys(keys: string[]): Promise<void> {
    await this.localStore.setClaimedRewardKeys(keys);
  }
}
