import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroPassClaimTrack } from '@features/neuroPass/domain/idempotency/keys';
import type { NeuroPassTier } from '@features/neuroPass/domain/entities/NeuroPassTier';

interface NeuroPassTierCellProps {
  tier: NeuroPassTier;
  premiumOwned: boolean;
  freeClaimed: boolean;
  premiumClaimed: boolean;
  freeClaiming?: boolean;
  premiumClaiming?: boolean;
  onClaimTier?: (tierIndex: number, track: NeuroPassClaimTrack) => void;
  onLockedPremiumPress?: (tierIndex: number) => void;
}

function NeuroPassTierCellComponent({
  tier,
  premiumOwned,
  freeClaimed,
  premiumClaimed,
  freeClaiming = false,
  premiumClaiming = false,
  onClaimTier,
  onLockedPremiumPress,
}: NeuroPassTierCellProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const tierUnlocked = tier.isUnlockedByProgress;

  const freeActionDisabled = !tierUnlocked || freeClaimed || freeClaiming;
  const freeActionLabel = freeClaimed
    ? copy.neuroPass.tierCell.claimed
    : freeClaiming
      ? copy.neuroPass.tierCell.claiming
      : tierUnlocked
        ? copy.neuroPass.tierCell.claim
        : copy.neuroPass.tierCell.locked;

  const premiumEntitlementLocked = !premiumOwned;
  const premiumActionDisabled =
    premiumClaimed || premiumClaiming || (!tierUnlocked && !premiumEntitlementLocked);
  const premiumActionLabel = premiumClaimed
    ? copy.neuroPass.tierCell.claimed
    : premiumClaiming
      ? copy.neuroPass.tierCell.claiming
      : premiumEntitlementLocked
        ? copy.neuroPass.tierCell.unlock
        : tierUnlocked
          ? copy.neuroPass.tierCell.claim
          : copy.neuroPass.tierCell.locked;

  return (
    <View style={[styles.row, tier.isMilestone && styles.milestoneRow]}>
      <Text style={styles.tierLabel}>T{tier.tierIndex}</Text>

      <View
        style={[
          styles.column,
          tierUnlocked && styles.unlockedColumn,
          freeClaimed && styles.claimedColumn,
        ]}
      >
        <Text style={styles.columnTitle}>{copy.neuroPass.tierCell.free}</Text>
        <Text numberOfLines={1} style={styles.rewardText}>
          {copy.neuroPass.rewardTitle(tier.freeReward.title)}
        </Text>
        <Pressable
          disabled={freeActionDisabled}
          onPress={() => {
            if (freeActionDisabled) {
              return;
            }
            onClaimTier?.(tier.tierIndex, 'free');
          }}
          style={[
            styles.actionButton,
            !freeActionDisabled && styles.actionButtonActive,
            freeClaimed && styles.actionButtonClaimed,
          ]}
        >
          <Text
            style={[styles.actionButtonText, !freeActionDisabled && styles.actionButtonTextActive]}
          >
            {freeActionLabel}
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.column,
          premiumEntitlementLocked && styles.lockedColumn,
          premiumClaimed && styles.claimedColumn,
          tierUnlocked && premiumOwned && styles.unlockedColumn,
        ]}
      >
        <View style={styles.premiumTop}>
          <Text style={styles.columnTitle}>{copy.neuroPass.tierCell.premium}</Text>
          {premiumEntitlementLocked ? (
            <Text style={styles.lockIcon}>{copy.neuroPass.tierCell.lock}</Text>
          ) : null}
        </View>
        <Text numberOfLines={1} style={styles.rewardText}>
          {copy.neuroPass.rewardTitle(tier.premiumReward.title)}
        </Text>
        <Pressable
          disabled={premiumActionDisabled}
          onPress={() => {
            if (premiumClaimed || premiumClaiming) {
              return;
            }
            if (premiumEntitlementLocked) {
              onLockedPremiumPress?.(tier.tierIndex);
              return;
            }
            if (!tierUnlocked) {
              return;
            }
            onClaimTier?.(tier.tierIndex, 'premium');
          }}
          style={[
            styles.actionButton,
            !premiumActionDisabled && styles.actionButtonActive,
            premiumClaimed && styles.actionButtonClaimed,
            premiumEntitlementLocked && styles.actionButtonPremiumLocked,
          ]}
        >
          <Text
            style={[
              styles.actionButtonText,
              !premiumActionDisabled && styles.actionButtonTextActive,
            ]}
          >
            {premiumActionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const NeuroPassTierCell = memo(NeuroPassTierCellComponent);

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xs,
    },
    milestoneRow: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
    tierLabel: {
      width: 32,
      textAlign: 'center',
      alignSelf: 'center',
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    column: {
      flex: 1,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.xs,
      gap: 2,
    },
    unlockedColumn: {
      borderColor: theme.colors.brand,
    },
    claimedColumn: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    lockedColumn: {
      opacity: 0.8,
    },
    premiumTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
    },
    columnTitle: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    rewardText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    lockIcon: {
      color: theme.colors.accent,
      ...theme.typography.caption,
      fontSize: 9,
      lineHeight: 11,
      letterSpacing: 0.3,
    },
    actionButton: {
      marginTop: 4,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      minHeight: 24,
    },
    actionButtonActive: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    actionButtonClaimed: {
      borderColor: theme.colors.brand,
    },
    actionButtonPremiumLocked: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
    actionButtonText: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
      fontSize: 10,
      lineHeight: 12,
      letterSpacing: 0.2,
    },
    actionButtonTextActive: {
      color: theme.colors.brand,
    },
  });
}
