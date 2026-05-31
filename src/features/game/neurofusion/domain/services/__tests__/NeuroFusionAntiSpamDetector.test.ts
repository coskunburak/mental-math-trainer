import { getDefaultNeuroFusionConfig } from '@features/game/neurofusion/domain/entities/NeuroFusionConfig';
import { NeuroFusionAntiSpamDetector } from '@features/game/neurofusion/domain/services/NeuroFusionAntiSpamDetector';

describe('NeuroFusionAntiSpamDetector', () => {
  it('flags spam bursts that exceed threshold', () => {
    const detector = new NeuroFusionAntiSpamDetector(getDefaultNeuroFusionConfig().antiSpam);

    const base = 5_000;
    detector.registerInput(base);
    detector.registerInput(base + 60);
    detector.registerInput(base + 120);
    detector.registerInput(base + 180);
    const burst = detector.registerInput(base + 220);

    expect(burst.isSpam).toBe(true);
  });

  it('does not repeatedly flag while cooldown is active', () => {
    const detector = new NeuroFusionAntiSpamDetector(getDefaultNeuroFusionConfig().antiSpam);

    const base = 8_000;
    detector.registerInput(base);
    detector.registerInput(base + 20);
    detector.registerInput(base + 40);
    detector.registerInput(base + 60);
    expect(detector.registerInput(base + 80).isSpam).toBe(true);

    detector.registerInput(base + 140);
    detector.registerInput(base + 180);
    detector.registerInput(base + 220);
    detector.registerInput(base + 260);
    expect(detector.registerInput(base + 300).isSpam).toBe(false);
  });
});
