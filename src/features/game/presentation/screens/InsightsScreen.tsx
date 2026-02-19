import { useMemo, useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { GameProgress } from '@features/game/domain/entities/GameProgress';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

interface InsightsScreenProps {
  progress: GameProgress;
  onBack: () => void;
}

export function InsightsScreen({ progress, onBack }: InsightsScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const topReveal = useRef(new Animated.Value(0)).current;
  const metricsReveal = useRef(new Animated.Value(0)).current;
  const modeReveal = useRef(new Animated.Value(0)).current;
  const typeReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const chain = [topReveal, metricsReveal, modeReveal, typeReveal];
    chain.forEach((value) => value.setValue(0));

    Animated.stagger(
      90,
      chain.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          tension: 88,
          friction: 10,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [metricsReveal, modeReveal, topReveal, typeReveal]);

  const lifetimeAccuracy = percentage(
    progress.lifetime.totalCorrectAnswers,
    progress.lifetime.totalAnswers,
  );
  const lifetimeAverageResponseMs = averageResponseFromTotals(progress.analytics.questionType);

  return (
    <Screen>
      <Animated.View style={[revealStyle(topReveal, 14), styles.topRow]}>
        <View>
          <Text style={styles.kicker}>{copy.insights.kicker}</Text>
          <Text style={styles.title}>{copy.insights.title}</Text>
        </View>
        <ThemeModeSwitch />
      </Animated.View>

      <Animated.View style={revealStyle(metricsReveal, 20)}>
        <Card tone="accent" style={styles.section}>
          <StatRow label={copy.insights.totalSessions} value={progress.lifetime.sessionsPlayed.toString()} styles={styles} />
          <StatRow label={copy.insights.lifetimeAccuracy} value={`${lifetimeAccuracy}%`} styles={styles} />
          <StatRow label={copy.insights.avgResponse} value={`${Math.round(lifetimeAverageResponseMs)} ms`} styles={styles} />
          <StatRow label={copy.insights.bestCombo} value={progress.lifetime.bestCombo.toString()} styles={styles} />
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(modeReveal, 24)}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.insights.modePerformance}</Text>
          {Object.entries(progress.analytics.mode).map(([mode, stats]) => {
            const modeAccuracy = percentage(stats.totalCorrectAnswers, stats.totalAnswers);
            const modeAverageResponseMs =
              stats.totalAnswers === 0 ? 0 : stats.totalResponseTimeMs / stats.totalAnswers;

            return (
              <View key={mode} style={styles.group}>
                <Text style={styles.groupTitle}>{copy.labels.mode[mode as keyof typeof copy.labels.mode]}</Text>
                <StatRow label={copy.insights.sessions} value={stats.sessionsPlayed.toString()} styles={styles} />
                <StatRow label={copy.insights.bestScore} value={stats.bestScore.toString()} styles={styles} />
                <StatRow label={copy.insights.accuracy} value={`${modeAccuracy}%`} styles={styles} />
                <StatRow label={copy.insights.avgResponse} value={`${Math.round(modeAverageResponseMs)} ms`} styles={styles} />
              </View>
            );
          })}
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(typeReveal, 28)}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.insights.operationPerformance}</Text>
          {Object.entries(progress.analytics.questionType).map(([questionType, stats]) => {
            const operationAccuracy = percentage(stats.correct, stats.answered);
            const operationAverage = stats.answered === 0 ? 0 : stats.totalResponseTimeMs / stats.answered;

            return (
              <View key={questionType} style={styles.group}>
                <Text style={styles.groupTitle}>
                  {copy.labels.questionType[questionType as keyof typeof copy.labels.questionType]}
                </Text>
                <StatRow label={copy.insights.answered} value={stats.answered.toString()} styles={styles} />
                <StatRow label={copy.insights.accuracy} value={`${operationAccuracy}%`} styles={styles} />
                <StatRow label={copy.insights.avgResponse} value={`${Math.round(operationAverage)} ms`} styles={styles} />
              </View>
            );
          })}
        </Card>
      </Animated.View>

      <View style={styles.actions}>
        <PrimaryButton onPress={onBack} variant="secondary">
          {copy.insights.backHome}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}

function StatRow({ label, value, styles }: StatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function averageResponseFromTotals(
  stats: GameProgress['analytics']['questionType'],
): number {
  const values = Object.values(stats);
  const answered = values.reduce((total, item) => total + item.answered, 0);
  const totalResponse = values.reduce((total, item) => total + item.totalResponseTimeMs, 0);
  return answered === 0 ? 0 : totalResponse / answered;
}

function percentage(correct: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((correct / total) * 100);
}

function revealStyle(value: Animated.Value, fromY: number) {
  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
        }),
      },
    ],
  } as const;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    kicker: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    group: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    groupTitle: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    label: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    value: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    actions: {
      marginTop: theme.spacing.sm,
    },
  });
}
