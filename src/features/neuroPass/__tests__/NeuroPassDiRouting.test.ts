jest.mock('@features/neuroPass/data/iap/RniapClient', () => ({
  RniapClient: class MockRniapClient {
    async initialize() {}
    async listProducts() { return []; }
    async requestPurchase() { throw new Error('not used in test'); }
    async restorePurchases() { return []; }
    async finishTransaction() {}
  },
}));

import { Container } from '@app/di/container';
import { registerNeuroPassModule } from '@app/di/modules/neuroPassModule';
import { TOKENS } from '@app/di/tokens';
import { ApiNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/api/ApiNeuroPassXpLedgerRepository';
import { LocalNeuroPassXpLedgerRepository } from '@features/neuroPass/data/repositories/local/LocalNeuroPassXpLedgerRepository';

import { InMemoryKeyValueStore } from './testUtils';

describe('NeuroPass DI backend routing', () => {
  it('uses local repositories by default', () => {
    const container = new Container();
    container.registerSingleton(TOKENS.keyValueStore, () => new InMemoryKeyValueStore());

    registerNeuroPassModule(container);

    const backendEnabled = container.resolve(TOKENS.neuroPassBackendEnabled);
    const xpRepo = container.resolve(TOKENS.neuroPassXpLedgerRepository);

    expect(backendEnabled).toBe(false);
    expect(xpRepo).toBeInstanceOf(LocalNeuroPassXpLedgerRepository);
  });

  it('routes xp ledger repository to api implementation when backend flag is enabled', () => {
    const container = new Container();
    container.registerSingleton(TOKENS.keyValueStore, () => new InMemoryKeyValueStore());

    registerNeuroPassModule(container, { backendEnabled: true });

    const backendEnabled = container.resolve(TOKENS.neuroPassBackendEnabled);
    const xpRepo = container.resolve(TOKENS.neuroPassXpLedgerRepository);

    expect(backendEnabled).toBe(true);
    expect(xpRepo).toBeInstanceOf(ApiNeuroPassXpLedgerRepository);
  });
});
