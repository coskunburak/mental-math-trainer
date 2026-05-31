import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';

import { NeuroPassStateBadge } from './NeuroPassStateBadge';

interface NeuroPassProgressHeaderProps {
  dashboard: NeuroPassDashboard;
  onSecretLongPress?: () => void;
}

export function NeuroPassProgressHeader({
  dashboard,
  onSecretLongPress,
}: NeuroPassProgressHeaderProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!dashboard.season) {
    return null;
  }

  const progressPct = Math.max(0, Math.min(1, dashboard.progress.tierProgressPct));
  const progressWidth = `${Math.round(progressPct * 100)}%` as `${number}%`;

  return (
    <Pressable style={styles.card} onLongPress={onSecretLongPress} delayLongPress={400}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>{copy.neuroPass.kicker}</Text>
          <Text style={styles.title}>
            {copy.neuroPass.seasonName(dashboard.season.id, dashboard.season.name)}
          </Text>
        </View>
        <NeuroPassStateBadge state={dashboard.state} />
      </View>

      <Text style={styles.timeLeft}>{copy.neuroPass.timeLeftLabel(dashboard.timeLeftMs)}</Text>

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>
          {copy.neuroPass.tierLabel(dashboard.effectiveTier, dashboard.season.tiersTotal)}
        </Text>
        <Text style={styles.metric}>{copy.neuroPass.nxpLabel(dashboard.progress.currentNxp)}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceAlt,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    titleWrap: {
      flex: 1,
      gap: 2,
    },
    kicker: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    timeLeft: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    metric: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    progressTrack: {
      marginTop: 2,
      width: '100%',
      height: 8,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.brand,
    },
  });
}
