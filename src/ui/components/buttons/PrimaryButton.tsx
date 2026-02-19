import { useMemo, type PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@app/theme';

type ButtonVariant = 'brand' | 'secondary';

interface PrimaryButtonProps extends PropsWithChildren {
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  variant = 'brand',
  style,
  textStyle,
}: PrimaryButtonProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'brand' ? styles.brand : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel, textStyle]}>{children}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    base: {
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.button,
    },
    brand: {
      backgroundColor: theme.colors.brand,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceStrong,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pressed: {
      transform: [{ translateY: 1 }, { scale: 0.995 }],
    },
    disabled: {
      opacity: 0.55,
    },
    label: {
      color: theme.colors.surfaceStrong,
      ...theme.typography.button,
    },
    secondaryLabel: {
      color: theme.colors.textPrimary,
    },
  });
}
