import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroPassQuestState } from '@features/neuroPass/domain/quests/NeuroPassQuestState';

import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';

interface QuestRowProps {
  quest: NeuroPassQuestState;
  localizedTitle: string;
  localizedDescription: string;
  disabled?: boolean;
  claiming?: boolean;
  onClaim: (questId: string) => void;
}

function QuestRowComponent({
  quest,
  localizedTitle,
  localizedDescription,
  disabled = false,
  claiming = false,
  onClaim,
}: QuestRowProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const safeProgress = Math.max(0, Math.min(quest.target, quest.progress));
  const progressPct = quest.target > 0 ? safeProgress / quest.target : 0;
  const progressWidth = `${Math.round(progressPct * 100)}%` as `${number}%`;

  const statusLabel = quest.status === 'claimed'
    ? copy.neuroPass.quests.statusClaimed
    : quest.status === 'completed'
      ? copy.neuroPass.quests.statusCompleted
      : copy.neuroPass.quests.statusActive;

  const claimDisabled = disabled || claiming || quest.status !== 'completed';
  const buttonLabel = quest.status === 'claimed'
    ? copy.neuroPass.quests.statusClaimed
    : claiming
      ? copy.neuroPass.quests.claiming
      : copy.neuroPass.quests.claim;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{localizedTitle}</Text>
        <View
          style={[
            styles.statusChip,
            quest.status === 'claimed' && styles.statusClaimed,
            quest.status === 'completed' && styles.statusCompleted,
          ]}
        >
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.description}>{localizedDescription}</Text>

      <View style={styles.progressMetaRow}>
        <Text style={styles.progressMeta}>{`${safeProgress}/${quest.target}`}</Text>
        <Text style={styles.rewardMeta}>{copy.neuroPass.quests.reward(quest.rewardNxp)}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <PrimaryButton
        variant="secondary"
        onPress={() => onClaim(quest.questId)}
        disabled={claimDisabled || quest.status === 'claimed'}
        style={styles.claimButton}
      >
        {buttonLabel}
      </PrimaryButton>
    </View>
  );
}

export const QuestRow = memo(QuestRowComponent);

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surfaceStrong,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    title: {
      flex: 1,
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    description: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    progressMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    progressMeta: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    rewardMeta: {
      color: theme.colors.brand,
      ...theme.typography.caption,
    },
    progressTrack: {
      width: '100%',
      height: 7,
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
    statusChip: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      backgroundColor: theme.colors.surface,
    },
    statusCompleted: {
      borderColor: theme.colors.accent,
    },
    statusClaimed: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    statusText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    claimButton: {
      minHeight: 34,
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.sm,
    },
  });
}
