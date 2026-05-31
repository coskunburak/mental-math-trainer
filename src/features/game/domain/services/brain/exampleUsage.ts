import { brainEvents } from '@core/analytics/events';
import {
  toBrainInsightTelemetry,
  toBrainScoreComputedTelemetry,
  toWeakAreasTelemetry,
} from '@features/game/domain/services/brain/BrainTelemetry';
import { BrainScoreCalculator } from '@features/game/domain/services/brain/BrainScoreCalculator';
import { InsightTextGenerator } from '@features/game/domain/services/brain/InsightTextGenerator';
import { TrendCalculator } from '@features/game/domain/services/brain/TrendCalculator';
import { WeaknessAnalyzer } from '@features/game/domain/services/brain/WeaknessAnalyzer';
import type { AnswerEvent, OperationType } from '@features/game/domain/entities/AnswerEvent';
import { toBrainScoreViewModel } from '@features/game/presentation/viewModels/BrainScoreViewModel';

export function runBrainPowerExample() {
  const events = buildExampleEvents();

  const scoreCalculator = new BrainScoreCalculator();
  const trendCalculator = new TrendCalculator(scoreCalculator);
  const weaknessAnalyzer = new WeaknessAnalyzer(scoreCalculator);
  const insightTextGenerator = new InsightTextGenerator();

  const dailyScores = trendCalculator.computeDailyScores(events);
  const latestScore = dailyScores[dailyScores.length - 1] ?? scoreCalculator.calculate({ events });
  const trend = trendCalculator.computeTrend({ dailyScores });
  const weaknessReport = weaknessAnalyzer.analyze(events);
  const insight = insightTextGenerator.generateTrendInsight(trend);

  const telemetry = {
    [brainEvents.brainScoreComputed]: toBrainScoreComputedTelemetry(latestScore),
    [brainEvents.brainInsightGenerated]: trend ? toBrainInsightTelemetry(trend) : [],
    [brainEvents.weakAreasComputed]: toWeakAreasTelemetry(weaknessReport),
  };

  return {
    latestScore,
    trend,
    weaknessReport,
    insight,
    viewModel: toBrainScoreViewModel(latestScore, trend, insight, weaknessReport),
    telemetry,
  };
}

function buildExampleEvents(): AnswerEvent[] {
  const operations: OperationType[] = ['add', 'sub', 'mul', 'div', 'mixed', 'sequence', 'missingNumber'];
  const output: AnswerEvent[] = [];

  let counter = 0;

  for (let day = 0; day < 14; day += 1) {
    for (let i = 0; i < 6; i += 1) {
      const operationType = operations[(day + i) % operations.length];
      const difficultyTier = 2 + ((day + i) % 6);
      const isRecentWindow = day >= 7;
      const isCorrect = (i + day) % 7 !== 0;
      const responseTimeMs = isRecentWindow ? 1_350 + i * 90 : 1_700 + i * 120;

      counter += 1;

      output.push({
        occurredAt: new Date(Date.UTC(2026, 0, day + 1, 10, i * 5, 0)).toISOString(),
        operationType,
        difficultyTier,
        stepCount: 1 + (i % 4),
        isCorrect,
        responseTimeMs,
        sessionId: `session-${day + 1}`,
        questionId: `q-${counter}`,
      });
    }
  }

  return output;
}
