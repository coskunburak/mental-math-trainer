import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';

import { NeuroPassStateBadge } from './NeuroPassStateBadge';

interface NeuroPassHomeCardProps {
  dashboard: NeuroPassDashboard;
  loading: boolean;
  onOpen: () => void;
}

function NeuroPassHomeCardComponent({ dashboard, loading, onOpen }: NeuroPassHomeCardProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (dashboard.status !== 'ready' || !dashboard.season) {
    return (
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>{copy.neuroPass.kicker}</Text>
          <NeuroPassStateBadge state={dashboard.state} />
        </View>
        <Text style={styles.title}>{copy.neuroPass.homeCard.unavailableTitle}</Text>
        <Text style={styles.subtle}>{copy.neuroPass.homeCard.unavailableBody}</Text>
        <PrimaryButton onPress={onOpen} variant="secondary">
          {copy.neuroPass.homeCard.open}
        </PrimaryButton>
      </Card>
    );
  }

  const pct = Math.max(0, Math.min(1, dashboard.progress.tierProgressPct));
  const progressWidth = `${Math.round(pct * 100)}%` as `${number}%`;

  return (
    <Card tone="accent" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>{copy.neuroPass.kicker}</Text>
          <Text style={styles.title}>
            {copy.neuroPass.seasonName(dashboard.season.id, dashboard.season.name)}
          </Text>
        </View>
        <NeuroPassStateBadge state={dashboard.state} />
      </View>

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>
          {copy.neuroPass.tierLabel(dashboard.effectiveTier, dashboard.season.tiersTotal)}
        </Text>
        <Text style={styles.metric}>{copy.neuroPass.nxpLabel(dashboard.progress.currentNxp)}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Text style={styles.subtle}>
        {loading ? copy.neuroPass.homeCard.refreshing : copy.neuroPass.timeLeftLabel(dashboard.timeLeftMs)}
      </Text>

      <PrimaryButton onPress={onOpen} variant="secondary">
        {copy.neuroPass.homeCard.open}
      </PrimaryButton>
    </Card>
  );
}

export const NeuroPassHomeCard = memo(NeuroPassHomeCardComponent);

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
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
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    metric: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    progressTrack: {
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
    subtle: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
  });
}
