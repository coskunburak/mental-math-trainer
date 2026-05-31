import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import type { NeuroPassIapProduct } from '@features/neuroPass/domain/repositories/NeuroPassIapRepository';

import type { IapClient } from './RniapClient';

export interface NeuroPassProductCatalog {
  seasonId: string;
  standardSku: string;
  plusSku: string;
  tierSkipSku5: string;
  products: Record<string, NeuroPassIapProduct>;
}

export class IapProductCatalog {
  constructor(
    private readonly iapClient: IapClient,
    private readonly skuBuilder: NeuroPassSkuBuilder,
  ) {}

  async load(seasonId: string): Promise<NeuroPassProductCatalog> {
    await this.iapClient.initialize();

    const standardSku = this.skuBuilder.buildStandardSku(seasonId);
    const plusSku = this.skuBuilder.buildPlusSku(seasonId);
    const tierSkipSku5 = this.skuBuilder.tierSkipSku5;

    const products = await this.iapClient.listProducts([standardSku, plusSku, tierSkipSku5]);

    return {
      seasonId,
      standardSku,
      plusSku,
      tierSkipSku5,
      products: products.reduce<Record<string, NeuroPassIapProduct>>((acc, product) => {
        if (product.sku.trim().length > 0) {
          acc[product.sku] = product;
        }
        return acc;
      }, {}),
    };
  }
}
