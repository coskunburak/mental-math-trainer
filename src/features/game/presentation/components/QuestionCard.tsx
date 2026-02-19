import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { Card } from '@ui/components/layout/Card';

interface QuestionCardProps {
  questionId: string;
  prompt: string;
  difficulty: number;
  inputValue: string;
  lastAnswerCorrect: boolean | null;
  compact?: boolean;
}

export function QuestionCard({
  questionId,
  prompt,
  difficulty,
  inputValue,
  lastAnswerCorrect,
  compact = false,
}: QuestionCardProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const reveal = useRef(new Animated.Value(1)).current;
  const feedbackPulse = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(0);
    Animated.spring(reveal, {
      toValue: 1,
      tension: 110,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [questionId, reveal]);

  useEffect(() => {
    if (lastAnswerCorrect == null) {
      return;
    }

    feedbackPulse.setValue(0);
    const pulse = Animated.sequence([
      Animated.timing(feedbackPulse, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackPulse, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);

    if (lastAnswerCorrect) {
      pulse.start();
      return;
    }

    shake.setValue(0);
    Animated.parallel([
      pulse,
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 1,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [feedbackPulse, lastAnswerCorrect, shake]);

  const feedbackColor =
    lastAnswerCorrect == null
      ? theme.colors.textSecondary
      : lastAnswerCorrect
        ? theme.colors.success
        : theme.colors.danger;

  const feedbackText =
    lastAnswerCorrect == null
      ? copy.game.feedbackIdle
      : lastAnswerCorrect
        ? copy.game.feedbackCorrect
        : copy.game.feedbackWrong;

  const promptStyle = {
    opacity: reveal,
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
      {
        scale: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
      {
        translateX: shake.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-8, 0, 8],
        }),
      },
    ],
  } as const;

  const flashStyle = {
    opacity: feedbackPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.22],
    }),
    transform: [
      {
        scale: feedbackPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1.04],
        }),
      },
    ],
  } as const;

  return (
    <Card tone="accent" style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{copy.game.difficultyBadge(difficulty)}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: feedbackColor }]} />
      </View>

      <Animated.Text style={[styles.prompt, compact && styles.promptCompact, promptStyle]}>{prompt}</Animated.Text>

      <View style={[styles.answerShell, compact && styles.answerShellCompact]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { backgroundColor: feedbackColor }, flashStyle]}
        />
        <Text style={[styles.answerText, compact && styles.answerTextCompact]}>
          {inputValue.length > 0 ? inputValue : copy.game.answerPlaceholder}
        </Text>
      </View>

      <Animated.Text style={[styles.feedback, compact && styles.feedbackCompact, { color: feedbackColor, opacity: 0.85 }, flashStyle]}>
        {feedbackText}
      </Animated.Text>
    </Card>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.lg,
    },
    cardCompact: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.brandSoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    badgeLabel: {
      color: theme.colors.brand,
      ...theme.typography.caption,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 12,
    },
    prompt: {
      textAlign: 'center',
      color: theme.colors.textPrimary,
      ...theme.typography.question,
    },
    promptCompact: {
      fontSize: 40,
      lineHeight: 42,
    },
    answerShell: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
      overflow: 'hidden',
    },
    answerShellCompact: {
      minHeight: 56,
    },
    flashOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    answerText: {
      color: theme.colors.textPrimary,
      ...theme.typography.answer,
    },
    answerTextCompact: {
      fontSize: 28,
      lineHeight: 30,
    },
    feedback: {
      textAlign: 'center',
      ...theme.typography.body,
    },
    feedbackCompact: {
      fontSize: 12,
      lineHeight: 16,
    },
  });
}
