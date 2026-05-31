import type { BrainTrend } from '@features/game/domain/entities/BrainTrend';
import { InsightTextGenerator } from '@features/game/domain/services/brain/InsightTextGenerator';
import { Confidence } from '@features/game/domain/valueObjects/Confidence';

describe('InsightTextGenerator', () => {
  it('uses cautious language when confidence is low', () => {
    const generator = new InsightTextGenerator();

    const trend: BrainTrend = {
      basis: 'last_7_vs_prev_7',
      recent: {
        startDateKey: '2026-02-08',
        endDateKey: '2026-02-14',
        daysWithScore: 4,
        averageScore: 620,
        averageSpeed: 0.62,
        averageConfidence: 0.4,
      },
      previous: {
        startDateKey: '2026-02-01',
        endDateKey: '2026-02-07',
        daysWithScore: 4,
        averageScore: 550,
        averageSpeed: 0.54,
        averageConfidence: 0.4,
      },
      overallDeltaPct: 12.73,
      speedDeltaPct: 14.82,
      confidence: Confidence.from(0.45),
      overallDirection: 'up',
      speedDirection: 'faster',
    };

    const insight = generator.generateTrendInsight(trend);

    expect(insight.overall).toContain('Early signal');
    expect(insight.speed).toContain('may be');
    expect(insight.confidenceLabel).toBe('low');
  });
});
