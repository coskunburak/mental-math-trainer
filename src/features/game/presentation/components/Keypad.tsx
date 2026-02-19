import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  compact?: boolean;
}

const ROWS: Array<Array<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0'>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0'],
];

export function Keypad({
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  isSubmitDisabled,
  compact = false,
}: KeypadProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const float = useRef(new Animated.Value(0)).current;
  const submitPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      float.stopAnimation();
    };
  }, [float]);

  useEffect(() => {
    if (isSubmitDisabled) {
      submitPulse.stopAnimation();
      submitPulse.setValue(0);
      return undefined;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(submitPulse, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(submitPulse, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
      submitPulse.stopAnimation();
    };
  }, [isSubmitDisabled, submitPulse]);

  const wrapperStyle = {
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
    ],
  } as const;

  const submitGlowStyle = {
    transform: [
      {
        scale: submitPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.015],
        }),
      },
    ],
    opacity: submitPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.9],
    }),
  } as const;

  return (
    <Animated.View style={[styles.wrapper, compact && styles.wrapperCompact, wrapperStyle]}>
      {ROWS.slice(0, 3).map((row, rowIndex) => (
        <View key={`digits-${rowIndex}`} style={[styles.row, compact && styles.rowCompact]}>
          {row.map((digit) => (
            <Pressable
              key={digit}
              style={({ pressed }) => [styles.key, compact && styles.keyCompact, pressed && styles.keyPressed]}
              onPress={() => onDigit(digit)}
            >
              <Text style={[styles.keyText, compact && styles.keyTextCompact]}>{digit}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <View style={[styles.row, compact && styles.rowCompact]}>
        <Pressable
          style={({ pressed }) => [styles.key, compact && styles.keyCompact, pressed && styles.keyPressed]}
          onPress={() => onDigit('0')}
        >
          <Text style={[styles.keyText, compact && styles.keyTextCompact]}>0</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.key, compact && styles.keyCompact, pressed && styles.keyPressed]}
          onPress={onBackspace}
        >
          <Text style={[styles.actionText, compact && styles.actionTextCompact]}>
            {copy.game.keypadDelete}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.key, compact && styles.keyCompact, pressed && styles.keyPressed]}
          onPress={onClear}
        >
          <Text style={[styles.actionText, compact && styles.actionTextCompact]}>
            {copy.game.keypadClear}
          </Text>
        </Pressable>
      </View>

      <Animated.View style={[styles.submitShell, compact && styles.submitShellCompact, !isSubmitDisabled && submitGlowStyle]}>
        <Pressable
          disabled={isSubmitDisabled}
          style={({ pressed }) => [
            styles.submit,
            compact && styles.submitCompact,
            isSubmitDisabled && styles.submitDisabled,
            pressed && !isSubmitDisabled && styles.submitPressed,
          ]}
          onPress={onSubmit}
        >
          <Text style={[styles.submitText, compact && styles.submitTextCompact]}>
            {copy.game.keypadSubmit}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    wrapper: {
      gap: theme.spacing.sm,
    },
    wrapperCompact: {
      gap: theme.spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    rowCompact: {
      gap: theme.spacing.xs,
    },
    key: {
      flex: 1,
      minHeight: 72,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.keypadSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyCompact: {
      minHeight: 58,
      borderRadius: theme.radius.sm,
    },
    keyPressed: {
      backgroundColor: theme.colors.keypadPressed,
      transform: [{ scale: 0.99 }],
    },
    keyText: {
      color: theme.colors.textPrimary,
      ...theme.typography.keypad,
    },
    keyTextCompact: {
      fontSize: 24,
      lineHeight: 24,
    },
    actionText: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    actionTextCompact: {
      fontSize: 13,
      lineHeight: 16,
    },
    submitShell: {
      marginTop: theme.spacing.xs,
    },
    submitShellCompact: {
      marginTop: 2,
    },
    submit: {
      minHeight: 60,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.brand,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.button,
    },
    submitCompact: {
      minHeight: 52,
      borderRadius: theme.radius.sm,
    },
    submitPressed: {
      backgroundColor: theme.colors.brandPressed,
      transform: [{ scale: 0.995 }],
    },
    submitDisabled: {
      opacity: 0.45,
    },
    submitText: {
      color: theme.colors.surfaceStrong,
      ...theme.typography.button,
    },
    submitTextCompact: {
      fontSize: 15,
      lineHeight: 18,
    },
  });
}
