import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroFusionPuzzle } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { Card } from '@ui/components/layout/Card';

interface PuzzleViewProps {
  item: NeuroFusionPuzzle;
  beatIndex: number;
  onSelectOption: (index: number) => void;
  showHint: boolean;
  showExplanation: boolean;
}

export function PuzzleView({
  item,
  beatIndex,
  onSelectOption,
  showHint,
  showExplanation,
}: PuzzleViewProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const beatsRemaining = Math.max(0, item.expiresAtBeat - beatIndex);
  const prompt = localizePuzzlePrompt(item, copy);
  const hint = localizePuzzleHint(item, copy);
  const explanation = localizePuzzleExplanation(item, copy);

  return (
    <Card tone="accent" style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>{copy.neuroFusion.puzzle.kicker}</Text>
        <Text style={styles.timer}>{copy.neuroFusion.puzzle.beatCount(beatsRemaining)}</Text>
      </View>

      <Text style={styles.prompt}>{prompt}</Text>

      {showHint && hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.optionGrid}>
        {item.options.map((option, index) => (
          <Pressable
            key={`${item.id}-${index}`}
            onPress={() => onSelectOption(index)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
      </View>

      {showExplanation ? <Text style={styles.explain}>{explanation}</Text> : null}
    </Card>
  );
}

function localizePuzzlePrompt(
  item: NeuroFusionPuzzle,
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  if (item.puzzleType === 'odd_one_out') {
    return copy.neuroFusion.puzzle.oddOneOutPrompt;
  }

  if (item.puzzleType === 'quick_estimate') {
    const match = item.prompt.match(/^Nearest estimate for\\s+(\\d+)\\s+\\+\\s+(\\d+)\\?$/);
    if (match) {
      return copy.neuroFusion.puzzle.quickEstimatePrompt(Number(match[1]), Number(match[2]));
    }
  }

  return item.prompt;
}

function localizePuzzleHint(
  item: NeuroFusionPuzzle,
  copy: ReturnType<typeof useLocalization>['copy'],
): string | undefined {
  if (!item.hint) {
    return undefined;
  }

  if (item.puzzleType === 'missing_sequence') {
    return item.explanation.includes('×')
      ? copy.neuroFusion.puzzle.missingSequenceHintMultiply
      : copy.neuroFusion.puzzle.missingSequenceHintAdd;
  }

  if (item.puzzleType === 'mixed_operation_pattern') {
    return copy.neuroFusion.puzzle.mixedOperationHint;
  }

  if (item.puzzleType === 'grid_mini') {
    return copy.neuroFusion.puzzle.gridHint;
  }

  if (item.puzzleType === 'odd_one_out') {
    return copy.neuroFusion.puzzle.oddOneOutHint;
  }

  if (item.puzzleType === 'equation_balance') {
    return copy.neuroFusion.puzzle.equationBalanceHint;
  }

  if (item.puzzleType === 'quick_estimate') {
    return copy.neuroFusion.puzzle.quickEstimateHint;
  }

  return item.hint;
}

function localizePuzzleExplanation(
  item: NeuroFusionPuzzle,
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  if (item.puzzleType === 'missing_sequence') {
    const multiplyMatch = item.explanation.match(/^Pattern is\\s+×(\\d+) each step\\.$/);
    if (multiplyMatch) {
      return copy.neuroFusion.puzzle.missingSequenceExplanationMultiply(Number(multiplyMatch[1]));
    }

    const addMatch = item.explanation.match(/^Pattern is\\s+\\+(\\d+) each step\\.$/);
    if (addMatch) {
      return copy.neuroFusion.puzzle.missingSequenceExplanationAdd(Number(addMatch[1]));
    }
  }

  if (item.puzzleType === 'mixed_operation_pattern') {
    const match = item.explanation.match(/^Each step is\\s+×(\\d+) then \\+(\\d+)\\.$/);
    if (match) {
      return copy.neuroFusion.puzzle.mixedOperationExplanation(Number(match[1]), Number(match[2]));
    }
  }

  if (item.puzzleType === 'grid_mini') {
    const match = item.explanation.match(/^Right adds\\s+(\\d+), down adds\\s+(\\d+)\\.$/);
    if (match) {
      return copy.neuroFusion.puzzle.gridExplanation(Number(match[1]), Number(match[2]));
    }
  }

  if (item.puzzleType === 'odd_one_out') {
    const match = item.explanation.match(/^Option\\s+(\\d+) is inconsistent with the repeated pattern\\.$/);
    if (match) {
      return copy.neuroFusion.puzzle.oddOneOutExplanation(Number(match[1]));
    }
  }

  if (item.puzzleType === 'equation_balance') {
    const match = item.explanation.match(/^Missing value is\\s+(\\d+)\\s+-\\s+(\\d+)\\s+=\\s+(\\d+)\\.$/);
    if (match) {
      return copy.neuroFusion.puzzle.equationBalanceExplanation(
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
      );
    }
  }

  if (item.puzzleType === 'quick_estimate') {
    const match = item.explanation.match(/^Exact is\\s+(\\d+), nearest ten is\\s+(\\d+)\\.$/);
    if (match) {
      return copy.neuroFusion.puzzle.quickEstimateExplanation(Number(match[1]), Number(match[2]));
    }
  }

  return item.explanation;
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
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
      lineHeight: 22,
    },
    hint: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    optionGrid: {
      gap: theme.spacing.xs,
    },
    option: {
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    optionPressed: {
      backgroundColor: theme.colors.brandSoft,
      borderColor: theme.colors.brand,
    },
    optionText: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    explain: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
  });
}
