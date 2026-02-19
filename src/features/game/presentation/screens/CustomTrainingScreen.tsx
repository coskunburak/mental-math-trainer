import { useMemo, useRef, useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { QuestionType } from '@features/game/domain/entities/Question';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

const DURATION_OPTIONS = [60, 90, 120, 180, 300] as const;
const QUESTION_LIMIT_OPTIONS = [10, 20, 30, 50] as const;

interface CustomTrainingScreenProps {
  values: {
    durationSeconds: number;
    questionLimit: number;
    questionTypes: QuestionType[];
  };
  unlockedQuestionTypes: QuestionType[];
  onChange: (next: {
    durationSeconds: number;
    questionLimit: number;
    questionTypes: QuestionType[];
  }) => void;
  onStart: () => void;
  onBack: () => void;
}

export function CustomTrainingScreen({
  values,
  unlockedQuestionTypes,
  onChange,
  onStart,
  onBack,
}: CustomTrainingScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const topReveal = useRef(new Animated.Value(0)).current;
  const cardReveal = useRef(new Animated.Value(0)).current;
  const actionReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const chain = [topReveal, cardReveal, actionReveal];
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
  }, [actionReveal, cardReveal, topReveal]);

  const setDuration = (durationSeconds: number) => {
    onChange({
      ...values,
      durationSeconds,
    });
  };

  const setQuestionLimit = (questionLimit: number) => {
    onChange({
      ...values,
      questionLimit,
    });
  };

  const toggleQuestionType = (type: QuestionType) => {
    const active = values.questionTypes.includes(type);

    if (active && values.questionTypes.length === 1) {
      return;
    }

    const questionTypes = active
      ? values.questionTypes.filter((item) => item !== type)
      : [...values.questionTypes, type];

    onChange({
      ...values,
      questionTypes,
    });
  };

  return (
    <Screen>
      <Animated.View style={[revealStyle(topReveal, 14), styles.topRow]}>
        <View>
          <Text style={styles.kicker}>{copy.customTraining.kicker}</Text>
          <Text style={styles.title}>{copy.customTraining.title}</Text>
        </View>
        <ThemeModeSwitch />
      </Animated.View>

      <Animated.View style={revealStyle(cardReveal, 22)}>
        <Card tone="accent" style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.customTraining.duration}</Text>
          <View style={styles.row}>
            {DURATION_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={copy.home.modeDurationTimed(item)}
                selected={values.durationSeconds === item}
                onPress={() => setDuration(item)}
                styles={styles}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>{copy.customTraining.questionLimit}</Text>
          <View style={styles.row}>
            {QUESTION_LIMIT_OPTIONS.map((item) => (
              <Chip
                key={item}
                label={`${item}`}
                selected={values.questionLimit === item}
                onPress={() => setQuestionLimit(item)}
                styles={styles}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>{copy.customTraining.operations}</Text>
          <View style={styles.grid}>
            {unlockedQuestionTypes.map((type) => (
              <Chip
                key={type}
                label={copy.labels.questionType[type]}
                selected={values.questionTypes.includes(type)}
                onPress={() => toggleQuestionType(type)}
                styles={styles}
                wide
              />
            ))}
          </View>
          <Text style={styles.hint}>
            {copy.customTraining.selected(
              values.questionTypes.map((item) => copy.labels.questionType[item]).join(' + '),
            )}
          </Text>
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(actionReveal, 30)}>
        <View style={styles.actions}>
          <PrimaryButton onPress={onStart}>{copy.customTraining.startCustomRun}</PrimaryButton>
          <PrimaryButton onPress={onBack} variant="secondary">
            {copy.common.back}
          </PrimaryButton>
        </View>
      </Animated.View>
    </Screen>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  wide?: boolean;
}

function Chip({ label, selected, onPress, styles, wide = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        wide && styles.chipWide,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
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
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    chip: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minWidth: 68,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipWide: {
      minWidth: 120,
      flex: 1,
    },
    chipSelected: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    chipPressed: {
      transform: [{ scale: 0.99 }],
    },
    chipText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    chipTextSelected: {
      color: theme.colors.brand,
    },
    hint: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    actions: {
      gap: theme.spacing.sm,
    },
  });
}
