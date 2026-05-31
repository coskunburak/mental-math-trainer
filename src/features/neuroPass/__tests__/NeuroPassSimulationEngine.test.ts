import { LocalConfigProvider } from '@features/neuroPass/data/config/LocalConfigProvider';
import { NeuroPassSimulationEngine, defaultSimulationInput } from '@features/neuroPass/domain/economy/NeuroPassSimulationEngine';
import { NeuroPassEconomyPolicy } from '@features/neuroPass/domain/policies/NeuroPassEconomyPolicy';

describe('NeuroPassSimulationEngine determinism', () => {
  it('returns deterministic results for same seed and input', () => {
    const provider = new LocalConfigProvider();
    const engine = new NeuroPassSimulationEngine(new NeuroPassEconomyPolicy(provider));

    const input = defaultSimulationInput('P75');
    const first = engine.run({ ...input, seed: 424242 });
    const second = engine.run({ ...input, seed: 424242 });

    expect(second).toEqual(first);
  });

  it('changes output when seed changes', () => {
    const provider = new LocalConfigProvider();
    const engine = new NeuroPassSimulationEngine(new NeuroPassEconomyPolicy(provider));

    const input = defaultSimulationInput('P50');
    const first = engine.run({ ...input, seed: 101 });
    const second = engine.run({ ...input, seed: 202 });

    expect(second).not.toEqual(first);
  });
});
