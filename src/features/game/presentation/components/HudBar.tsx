import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { formatRemainingTime } from '@core/utils/time';

interface HudBarProps {
  remainingMs: number;
  score: number;
  combo: number;
  level: number;
  isTimedMode?: boolean;
  isUrgent?: boolean;
  compact?: boolean;
}

export function HudBar({
  remainingMs,
  score,
  combo,
  level,
  isTimedMode = true,
  isUrgent = false,
  compact = false,
}: HudBarProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const urgency = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isUrgent) {
      urgency.stopAnimation();
      urgency.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(urgency, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(urgency, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      urgency.stopAnimation();
    };
  }, [isUrgent, urgency]);

  const timeAnimatedStyle = {
    transform: [
      {
        scale: urgency.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.03],
        }),
      },
    ],
    opacity: urgency.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.88],
    }),
  } as const;

  return (
    <View style={styles.container}>
      <HudItem
        label={copy.game.hudTime}
        value={isTimedMode ? formatRemainingTime(remainingMs) : '∞'}
        styles={styles}
        compact={compact}
        emphasize={isTimedMode && isUrgent}
        animatedStyle={isTimedMode && isUrgent ? timeAnimatedStyle : undefined}
      />
      <HudItem label={copy.game.hudScore} value={score.toString()} styles={styles} compact={compact} />
      <HudItem label={copy.game.hudCombo} value={combo.toString()} styles={styles} compact={compact} />
      <HudItem label={copy.game.hudLevel} value={level.toString()} styles={styles} compact={compact} />
    </View>
  );
}

interface HudItemProps {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  emphasize?: boolean;
  compact?: boolean;
  animatedStyle?: object;
}

function HudItem({
  label,
  value,
  styles,
  emphasize = false,
  compact = false,
  animatedStyle,
}: HudItemProps) {
  return (
    <Animated.View style={[styles.item, compact && styles.itemCompact, emphasize && styles.itemEmphasis, animatedStyle]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: theme.spacing.sm,
    },
    item: {
      flex: 1,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      ...theme.shadows.card,
    },
    itemCompact: {
      paddingVertical: theme.spacing.xs,
      minHeight: 56,
    },
    itemEmphasis: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.accentSoft,
    },
    label: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    labelCompact: {
      fontSize: 10,
      lineHeight: 12,
    },
    value: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textPrimary,
      ...theme.typography.metric,
    },
    valueCompact: {
      marginTop: 2,
      fontSize: 20,
      lineHeight: 22,
    },
  });
}
