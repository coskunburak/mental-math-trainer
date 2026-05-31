import type { NeuroPassEntitlement } from '@features/neuroPass/domain/entities/NeuroPassEntitlement';

export interface NeuroPassIapProduct {
  sku: string;
  title: string;
  description: string;
  localizedPrice: string;
  price: number | null;
  currency: string;
}

export interface NeuroPassIapTransaction {
  sku: string;
  transactionId: string;
  purchaseToken: string;
  transactionDateUtc: string;
  receipt: string;
}

export interface NeuroPassIapPurchaseRecord {
  transactionId: string;
  purchaseToken: string;
  sku: string;
  seasonId: string;
  grantedAtUtc: string;
}

export interface NeuroPassIapRepository {
  initialize(): Promise<void>;
  listProducts(skus: string[]): Promise<NeuroPassIapProduct[]>;
  requestPurchase(sku: string): Promise<NeuroPassIapTransaction>;
  restorePurchases(): Promise<NeuroPassIapTransaction[]>;
  finishTransaction(transaction: NeuroPassIapTransaction, consumable: boolean): Promise<void>;

  getEntitlement(seasonId: string): Promise<NeuroPassEntitlement>;
  setEntitlement(seasonId: string, entitlement: NeuroPassEntitlement): Promise<void>;

  getIapPurchaseRecords(): Promise<NeuroPassIapPurchaseRecord[]>;
  upsertIapPurchaseRecord(record: NeuroPassIapPurchaseRecord): Promise<void>;

  getTierSkipDailyCounter(dayKey: string): Promise<number>;
  setTierSkipDailyCounter(dayKey: string, count: number): Promise<void>;

  getClaimedRewardKeys(): Promise<string[]>;
  setClaimedRewardKeys(keys: string[]): Promise<void>;
}
