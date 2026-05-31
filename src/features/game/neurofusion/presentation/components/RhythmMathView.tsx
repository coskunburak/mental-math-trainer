import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroFusionRhythmQuestion } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { Card } from '@ui/components/layout/Card';

interface RhythmMathViewProps {
  item: NeuroFusionRhythmQuestion;
  beatIndex: number;
  answerInput: string;
  lastAnswerCorrect: boolean | null;
}

export function RhythmMathView({
  item,
  beatIndex,
  answerInput,
  lastAnswerCorrect,
}: RhythmMathViewProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const beatsRemaining = Math.max(0, item.expiresAtBeat - beatIndex);
  const beatsElapsed = Math.max(0, beatIndex - item.startsAtBeat);
  const progress = item.beatsPerQuestion <= 0 ? 1 : beatsElapsed / item.beatsPerQuestion;

  const status =
    lastAnswerCorrect == null
      ? copy.neuroFusion.rhythm.statusIdle
      : lastAnswerCorrect
        ? copy.neuroFusion.rhythm.statusCorrect
        : copy.neuroFusion.rhythm.statusWrong;

  const statusColor =
    lastAnswerCorrect == null
      ? theme.colors.textSecondary
      : lastAnswerCorrect
        ? theme.colors.success
        : theme.colors.danger;

  return (
    <Card tone="accent" style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>{copy.neuroFusion.rhythm.kicker}</Text>
        <Text style={styles.timer}>{copy.neuroFusion.rhythm.beatCount(beatsRemaining)}</Text>
      </View>

      <Text style={styles.prompt}>{item.prompt}</Text>

      <View style={styles.inputShell}>
        <Text style={styles.inputText}>{answerInput.length > 0 ? answerInput : '...'}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
      </View>

      <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
    </Card>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    kicker: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    timer: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    prompt: {
      textAlign: 'center',
      color: theme.colors.textPrimary,
      ...theme.typography.question,
    },
    inputShell: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      minHeight: 62,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputText: {
      color: theme.colors.textPrimary,
      ...theme.typography.answer,
    },
    progressTrack: {
      height: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceStrong,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.brand,
    },
    status: {
      textAlign: 'center',
      ...theme.typography.body,
    },
  });
}
