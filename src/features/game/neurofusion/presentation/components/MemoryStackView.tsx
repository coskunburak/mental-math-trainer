import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroFusionMemoryStack } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { Card } from '@ui/components/layout/Card';

interface MemoryStackViewProps {
  item: NeuroFusionMemoryStack;
  beatIndex: number;
  answerInput: string;
}

export function MemoryStackView({ item, beatIndex, answerInput }: MemoryStackViewProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const beatsRemaining = Math.max(0, item.expiresAtBeat - beatIndex);
  const baseLabel =
    item.revealMode === 'base_last'
      ? copy.neuroFusion.memory.baseUnknown
      : copy.neuroFusion.memory.baseKnown(item.baseNumber);

  return (
    <Card tone="accent" style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>{copy.neuroFusion.memory.kicker}</Text>
        <Text style={styles.timer}>{copy.neuroFusion.memory.beatCount(beatsRemaining)}</Text>
      </View>

      <Text style={styles.base}>{baseLabel}</Text>

      <View style={styles.stepRow}>
        {item.steps.map((step, index) => (
          <View key={`${item.id}-step-${index}`} style={styles.stepChip}>
            <Text style={styles.stepText}>{`${step.operator}${step.value}`}</Text>
          </View>
        ))}
      </View>

      <View style={styles.inputShell}>
        <Text style={styles.inputText}>{answerInput.length > 0 ? answerInput : '...'}</Text>
      </View>

      <Text style={styles.caption}>{copy.neuroFusion.memory.caption}</Text>
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
    base: {
      textAlign: 'center',
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    stepRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      justifyContent: 'center',
    },
    stepChip: {
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
    },
    stepText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    inputShell: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      minHeight: 58,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputText: {
      color: theme.colors.textPrimary,
      ...theme.typography.answer,
    },
    caption: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      ...theme.typography.caption,
    },
  });
}
