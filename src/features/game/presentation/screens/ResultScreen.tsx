import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { SubscriptionTier } from '@features/game/domain/entities/Monetization';
import type { QuestionType } from '@features/game/domain/entities/Question';
import type { GameLifetimeStats } from '@features/game/domain/entities/GameProgress';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

import type { GameSessionSummary } from '../state/gameStore';

interface ResultScreenProps {
  summary: GameSessionSummary;
  lifetime: GameLifetimeStats;
  subscriptionTier: SubscriptionTier;
  rewardedBonusXp: number;
  rewardedClaimed: boolean;
  onClaimRewardedBonus: () => Promise<boolean>;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export function ResultScreen({
  summary,
  lifetime,
  subscriptionTier,
  rewardedBonusXp,
  rewardedClaimed,
  onClaimRewardedBonus,
  onPlayAgain,
  onBackHome,
}: ResultScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

  const titleReveal = useRef(new Animated.Value(0)).current;
  const cardOneReveal = useRef(new Animated.Value(0)).current;
  const cardTwoReveal = useRef(new Animated.Value(0)).current;
  const actionsReveal = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  const scoreCount = useCountUp(summary.score, 720, summary.sessionId);
  const accuracyCount = useCountUp(Math.round(summary.accuracyRate * 100), 680, summary.sessionId);
  const comboCount = useCountUp(summary.bestCombo, 560, summary.sessionId);
  const xpCount = useCountUp(summary.gainedXp, 700, summary.sessionId);
  const finishReason = formatFinishReason(summary.reason, copy);
  const operationsLabel = formatQuestionTypes(summary.questionTypes, copy);
  const canShowRewardedBonus = subscriptionTier === 'free' && !rewardedClaimed;

  useEffect(() => {
    const revealOrder = [titleReveal, cardOneReveal, cardTwoReveal, actionsReveal];
    revealOrder.forEach((value) => value.setValue(0));

    Animated.stagger(
      90,
      revealOrder.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          tension: 88,
          friction: 10,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [actionsReveal, cardOneReveal, cardTwoReveal, titleReveal, summary.sessionId]);

  useEffect(() => {
    halo.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      halo.stopAnimation();
    };
  }, [halo, summary.sessionId]);

  return (
    <Screen>
      <Animated.View style={[revealStyle(titleReveal, 14), styles.topRow]}>
        <View>
          <Text style={styles.kicker}>{copy.result.kicker}</Text>
          <View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.titleHalo,
                {
                  opacity: halo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.32],
                  }),
                  transform: [
                    {
                      scale: halo.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.94, 1.08],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Text style={styles.title}>{copy.result.title}</Text>
          </View>
        </View>
        <ThemeModeSwitch />
      </Animated.View>

      <Animated.View style={revealStyle(cardOneReveal, 22)}>
        <Card tone="accent" style={styles.section}>
          <StatRow label={copy.result.mode} value={copy.labels.mode[summary.mode]} styles={styles} />
          <StatRow label={copy.result.endedBy} value={finishReason} styles={styles} />
          <StatRow label={copy.result.operations} value={operationsLabel} styles={styles} />
          <StatRow label={copy.result.score} value={scoreCount.toString()} styles={styles} />
          <StatRow label={copy.result.accuracy} value={`${accuracyCount}%`} styles={styles} />
          <StatRow label={copy.result.avgResponse} value={`${summary.averageResponseTimeMs} ms`} styles={styles} />
          <StatRow label={copy.result.correctTotal} value={`${summary.correctAnswers} / ${summary.totalAnswers}`} styles={styles} />
          <StatRow label={copy.result.bestCombo} value={comboCount.toString()} styles={styles} />
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(cardTwoReveal, 26)}>
        <Card style={styles.section}>
          <StatRow label={copy.result.xpGained} value={`+${xpCount}`} styles={styles} />
          <StatRow label={copy.result.totalXp} value={summary.totalXp.toString()} styles={styles} />
          <StatRow label={copy.result.level} value={`${summary.levelBefore} -> ${summary.levelAfter}`} styles={styles} />
          <StatRow label={copy.result.streakDays} value={lifetime.streakDays.toString()} styles={styles} />
          <StatRow label={copy.result.runsPlayed} value={lifetime.sessionsPlayed.toString()} styles={styles} />
        </Card>
      </Animated.View>

      {canShowRewardedBonus && (
        <Animated.View style={revealStyle(cardTwoReveal, 30)}>
          <Card style={styles.section}>
            <Text style={styles.rewardTitle}>{copy.result.sessionBonus}</Text>
            <Text style={styles.rewardBody}>{copy.result.sessionBonusBody(rewardedBonusXp)}</Text>
            <PrimaryButton
              disabled={claiming}
              onPress={async () => {
                setClaiming(true);
                const granted = await onClaimRewardedBonus();
                setClaiming(false);
                setClaimMessage(granted ? copy.result.bonusApplied : copy.result.bonusUnavailable);
              }}
            >
              {claiming ? copy.result.loading : copy.result.watchAdAndClaim}
            </PrimaryButton>
            {claimMessage.length > 0 && <Text style={styles.rewardMessage}>{claimMessage}</Text>}
          </Card>
        </Animated.View>
      )}

      <Animated.View style={revealStyle(actionsReveal, 30)}>
        <View style={styles.actions}>
          <PrimaryButton onPress={onPlayAgain}>{copy.result.runAgain}</PrimaryButton>
          <PrimaryButton onPress={onBackHome} variant="secondary">
            {copy.common.home}
          </PrimaryButton>
        </View>
      </Animated.View>
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

function useCountUp(target: number, durationMs: number, triggerKey: string): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      setValue(Math.round(target * progress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    setValue(0);
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [durationMs, target, triggerKey]);

  return value;
}

function formatFinishReason(
  reason: GameSessionSummary['reason'],
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  return copy.labels.finishReason[reason];
}

function formatQuestionTypes(
  types: QuestionType[],
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  if (types.length === 0) {
    return copy.common.none;
  }

  return types.map((type) => copy.labels.questionTypeShort[type]).join(' + ');
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    titleHalo: {
      position: 'absolute',
      left: -12,
      right: -12,
      top: -6,
      bottom: -6,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.brandSoft,
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
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    rewardTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    rewardBody: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    rewardMessage: {
      color: theme.colors.success,
      ...theme.typography.caption,
    },
  });
}
