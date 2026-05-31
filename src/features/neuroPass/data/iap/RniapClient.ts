import { Platform } from 'react-native';

import type {
  NeuroPassIapProduct,
  NeuroPassIapTransaction,
} from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';

interface PurchaseError {
  code?: string;
  message?: string;
}

interface ListenerSubscription {
  remove: () => void;
}

type UnknownRniapModule = {
  initConnection?: () => Promise<boolean>;
  endConnection?: () => Promise<void>;
  getProducts?: (input: { skus: string[] } | string[]) => Promise<Array<Record<string, unknown>>>;
  getAvailablePurchases?: () => Promise<Array<Record<string, unknown>>>;
  requestPurchase?: (input: unknown) => Promise<unknown>;
  finishTransaction?: (
    input:
      | { purchase: Record<string, unknown>; isConsumable: boolean }
      | Record<string, unknown>,
    isConsumable?: boolean,
  ) => Promise<void>;
  purchaseUpdatedListener?: (listener: (purchase: Record<string, unknown>) => void) => ListenerSubscription;
  purchaseErrorListener?: (listener: (error: PurchaseError) => void) => ListenerSubscription;
};

export interface IapClient {
  initialize(): Promise<void>;
  listProducts(skus: string[]): Promise<NeuroPassIapProduct[]>;
  requestPurchase(sku: string): Promise<NeuroPassIapTransaction>;
  restorePurchases(): Promise<NeuroPassIapTransaction[]>;
  finishTransaction(transaction: NeuroPassIapTransaction, consumable: boolean): Promise<void>;
}

export class RniapClient implements IapClient {
  private readonly module: UnknownRniapModule | null;

  constructor() {
    this.module = getRniapModule();
  }

  async initialize(): Promise<void> {
    if (!this.module?.initConnection) {
      return;
    }

    await this.module.initConnection();
  }

  async listProducts(skus: string[]): Promise<NeuroPassIapProduct[]> {
    const requestedSkus = skus.filter((item) => item.trim().length > 0);
    if (requestedSkus.length === 0) {
      return [];
    }

    if (!this.module?.getProducts) {
      return requestedSkus.map((sku) => fallbackProduct(sku));
    }

    const rawProducts = await this.module.getProducts({ skus: requestedSkus });
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return requestedSkus.map((sku) => fallbackProduct(sku));
    }

    return rawProducts.map((item) => normalizeProduct(item));
  }

  async requestPurchase(sku: string): Promise<NeuroPassIapTransaction> {
    const module = this.module;
    if (!module?.requestPurchase) {
      throw new Error('react_native_iap_unavailable');
    }

    return new Promise<NeuroPassIapTransaction>((resolve, reject) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      const complete = (fn: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        purchaseSub?.remove();
        errorSub?.remove();
        fn();
      };

      const purchaseSub = module.purchaseUpdatedListener?.((purchase) => {
        const productId = String(purchase.productId ?? purchase.productIdAndroid ?? '').trim();
        if (productId !== sku) {
          return;
        }

        const transaction = normalizeTransaction(purchase);
        complete(() => resolve(transaction));
      });

      const errorSub = module.purchaseErrorListener?.((error) => {
        complete(() => reject(error));
      });

      timeout = setTimeout(() => {
        complete(() => reject(new Error('purchase_timeout')));
      }, 60_000);

      const purchaseRequestPayload =
        Platform.OS === 'android'
          ? { skus: [sku] }
          : { sku };

      Promise.resolve(module.requestPurchase?.(purchaseRequestPayload)).catch((error) => {
        complete(() => reject(error));
      });
    });
  }

  async restorePurchases(): Promise<NeuroPassIapTransaction[]> {
    if (!this.module?.getAvailablePurchases) {
      return [];
    }

    const purchases = await this.module.getAvailablePurchases();
    if (!Array.isArray(purchases)) {
      return [];
    }

    return purchases.map((purchase) => normalizeTransaction(purchase));
  }

  async finishTransaction(transaction: NeuroPassIapTransaction, consumable: boolean): Promise<void> {
    if (!this.module?.finishTransaction) {
      return;
    }

    const payload = {
      productId: transaction.sku,
      transactionId: transaction.transactionId,
      purchaseToken: transaction.purchaseToken,
      transactionDate: Date.parse(transaction.transactionDateUtc),
      transactionReceipt: transaction.receipt,
    };

    try {
      await this.module.finishTransaction({
        purchase: payload,
        isConsumable: consumable,
      });
    } catch {
      await this.module.finishTransaction(payload, consumable);
    }
  }
}

function getRniapModule(): UnknownRniapModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-iap') as UnknownRniapModule;
  } catch {
    return null;
  }
}

function normalizeProduct(raw: Record<string, unknown>): NeuroPassIapProduct {
  const sku = String(raw.productId ?? raw.productIdAndroid ?? '').trim();
  const localizedPrice = String(raw.localizedPrice ?? '').trim();
  const priceValue = Number(raw.price ?? raw.priceAmountMicros ?? Number.NaN);

  return {
    sku,
    title: String(raw.title ?? sku),
    description: String(raw.description ?? ''),
    localizedPrice: localizedPrice.length > 0 ? localizedPrice : '$--',
    price: Number.isFinite(priceValue)
      ? priceValue > 10_000
        ? Math.round((priceValue / 1_000_000) * 100) / 100
        : priceValue
      : null,
    currency: String(raw.currency ?? raw.currencyCode ?? '').trim(),
  };
}

function normalizeTransaction(raw: Record<string, unknown>): NeuroPassIapTransaction {
  const sku = String(raw.productId ?? raw.productIdAndroid ?? '').trim();
  const transactionId = String(raw.transactionId ?? raw.orderId ?? `${sku}_${Date.now()}`).trim();
  const purchaseToken = String(raw.purchaseToken ?? raw.transactionReceipt ?? transactionId).trim();

  const rawDate = raw.transactionDate;
  const dateMs = typeof rawDate === 'number'
    ? rawDate
    : typeof rawDate === 'string'
      ? Number(rawDate)
      : Date.now();

  const transactionDateUtc = Number.isFinite(dateMs)
    ? new Date(dateMs).toISOString()
    : new Date().toISOString();

  return {
    sku,
    transactionId,
    purchaseToken,
    transactionDateUtc,
    receipt: String(raw.transactionReceipt ?? '').trim(),
  };
}

function fallbackProduct(sku: string): NeuroPassIapProduct {
  return {
    sku,
    title: sku,
    description: '',
    localizedPrice: '$--',
    price: null,
    currency: '',
  };
}
