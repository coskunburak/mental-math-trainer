import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';

interface UrgencyBarProps {
  hoursLeft: number;
  ratioToDeadline: number;
}

export function UrgencyBar({ hoursLeft, ratioToDeadline }: UrgencyBarProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const safeRatio = Math.max(0, Math.min(1, ratioToDeadline));
  const width = `${Math.round(safeRatio * 100)}%` as `${number}%`;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{copy.neuroPass.urgency.label(hoursLeft)}</Text>
        <Text style={styles.hours}>{copy.neuroPass.urgency.hoursShort(hoursLeft)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    label: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    hours: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    track: {
      height: 6,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
    },
  });
}
