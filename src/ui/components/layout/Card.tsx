import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@app/theme';

type CardTone = 'default' | 'accent';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  tone?: CardTone;
}

export function Card({ children, style, tone = 'default' }: CardProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.card, tone === 'accent' && styles.accent, style]}>{children}</View>;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.card,
    },
    accent: {
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceAlt,
    },
  });
}
