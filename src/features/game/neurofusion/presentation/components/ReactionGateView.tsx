import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroFusionReactionGate } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { Card } from '@ui/components/layout/Card';

interface ReactionGateViewProps {
  item: NeuroFusionReactionGate;
  beatIndex: number;
  onAnswer: (answer: boolean) => void;
}

export function ReactionGateView({ item, beatIndex, onAnswer }: ReactionGateViewProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const beatsRemaining = Math.max(0, item.expiresAtBeat - beatIndex);

  return (
    <Card tone="accent" style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>{copy.neuroFusion.reaction.kicker}</Text>
        <Text style={styles.timer}>{copy.neuroFusion.reaction.beatCount(beatsRemaining)}</Text>
      </View>

      <Text style={styles.prompt}>{item.prompt}</Text>

      <View style={styles.row}>
        <GateButton label={copy.neuroFusion.reaction.trueLabel} onPress={() => onAnswer(true)} styles={styles} />
        <GateButton label={copy.neuroFusion.reaction.falseLabel} onPress={() => onAnswer(false)} styles={styles} />
      </View>

      <Text style={styles.caption}>{copy.neuroFusion.reaction.reactionWindow(item.reactionWindowMs)}</Text>
    </Card>
  );
}

function GateButton({
  label,
  onPress,
  styles,
}: {
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      fontSize: 40,
      lineHeight: 42,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    button: {
      flex: 1,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPressed: {
      backgroundColor: theme.colors.brandSoft,
      borderColor: theme.colors.brand,
      transform: [{ scale: 0.99 }],
    },
    buttonText: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    caption: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
  });
}
