import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { type NeuroPassSeasonState } from '@features/neuroPass/domain/types/NeuroPassSeasonState';

interface NeuroPassStateBadgeProps {
  state: NeuroPassSeasonState;
}

export function NeuroPassStateBadge({ state }: NeuroPassStateBadgeProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.badge, state === 'active' && styles.active, state === 'grace' && styles.grace]}>
      <Text style={styles.text}>{copy.neuroPass.stateLabel[state]}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
    },
    active: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    grace: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
    text: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
      letterSpacing: 0.5,
    },
  });
}
