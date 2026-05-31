import { SpamTapDetector } from '@features/neuroPass/domain/antiAbuse/SpamTapDetector';

describe('SpamTapDetector', () => {
  const detector = new SpamTapDetector();

  it('returns low spam score for normal paced inputs', () => {
    const result = detector.detect({
      submissionTimestampsMs: [0, 260, 510, 760, 1020, 1280, 1535],
    });

    expect(result.spamScore).toBeLessThan(0.2);
    expect(result.penalty).toBeLessThan(12);
  });

  it('detects extremely high-frequency tap spam', () => {
    const result = detector.detect({
      submissionTimestampsMs: [0, 45, 90, 136, 180, 226, 270, 315, 360],
      repeatedIdenticalInputFastCount: 6,
    });

    expect(result.spamScore).toBeGreaterThan(0.75);
    expect(result.penalty).toBeGreaterThanOrEqual(45);
  });

  it('increases score for long constant interval bursts', () => {
    const result = detector.detect({
      submissionTimestampsMs: [0, 100, 201, 301, 402, 503, 603, 704, 805, 906],
      identicalInputBurstCount: 4,
    });

    expect(result.stats.constantBurstScore).toBeGreaterThan(0.4);
    expect(result.spamScore).toBeGreaterThan(0.15);
  });
});
