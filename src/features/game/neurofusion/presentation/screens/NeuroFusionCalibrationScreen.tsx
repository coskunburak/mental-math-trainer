import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

interface NeuroFusionCalibrationScreenProps {
  bpm: number;
  tapCount: number;
  targetTapCount: number;
  onTap: () => void;
  onCancel: () => void;
}

export function NeuroFusionCalibrationScreen({
  bpm,
  tapCount,
  targetTapCount,
  onTap,
  onCancel,
}: NeuroFusionCalibrationScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const beatDurationMs = 60_000 / Math.max(60, Math.min(220, bpm));

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: Math.round(beatDurationMs * 0.38),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: Math.round(beatDurationMs * 0.62),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      pulse.stopAnimation();
    };
  }, [bpm, pulse]);

  return (
    <Screen>
      <Card tone="accent" style={styles.card}>
        <Text style={styles.title}>{copy.neuroFusion.calibration.title}</Text>
        <Text style={styles.body}>{copy.neuroFusion.calibration.body(targetTapCount)}</Text>

        <Animated.View
          style={[
            styles.pulse,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1.12],
                  }),
                },
              ],
            },
          ]}
        />

        <Text style={styles.counter}>{tapCount} / {targetTapCount}</Text>

        <PrimaryButton onPress={onTap}>{copy.neuroFusion.calibration.tapOnBeat}</PrimaryButton>
        <PrimaryButton onPress={onCancel} variant="secondary">
          {copy.neuroFusion.calibration.cancel}
        </PrimaryButton>
      </Card>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
    },
    body: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    pulse: {
      width: 120,
      height: 120,
      borderRadius: 120,
      backgroundColor: theme.colors.brand,
    },
    counter: {
      color: theme.colors.accent,
      ...theme.typography.subtitle,
    },
  });
}
