import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroPassDailyQuest } from '@features/neuroPass/domain/usecases/LoadDailyQuestsForToday';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';

interface ClaimQuestResult {
  grantedAmount: number;
  isDuplicate: boolean;
}

interface NeuroPassDailyQuestsCardProps {
  quests: NeuroPassDailyQuest[];
  disabled?: boolean;
  onClaimQuest: (questId: string) => Promise<ClaimQuestResult>;
}

function NeuroPassDailyQuestsCardComponent({
  quests,
  disabled = false,
  onClaimQuest,
}: NeuroPassDailyQuestsCardProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const visibleQuests = quests.slice(0, 3);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 1700);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  return (
    <Card style={styles.card}>
      <Text style={styles.kicker}>{copy.neuroPass.dailyQuests.kicker}</Text>
      <Text style={styles.title}>{copy.neuroPass.dailyQuests.title}</Text>
      <Text style={styles.subtitle}>{copy.neuroPass.dailyQuests.subtitle}</Text>

      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      {visibleQuests.map((quest) => {
        const localizedQuest = copy.neuroPass.dailyQuests.questText(
          quest.id,
          quest.title,
          quest.description,
        );
        const claimed = quest.state === 'claimed';
        const pending = claimingQuestId === quest.id;

        return (
          <View key={quest.id} style={styles.questRow}>
            <View style={styles.questMeta}>
              <Text style={styles.questTitle}>{localizedQuest.title}</Text>
              <Text style={styles.questBody}>{localizedQuest.description}</Text>
              <Text style={styles.rewardLabel}>{copy.neuroPass.dailyQuests.reward(quest.rewardNxp)}</Text>
            </View>

            <PrimaryButton
              variant="secondary"
              disabled={disabled || claimed || pending}
              onPress={() => {
                setClaimingQuestId(quest.id);
                void onClaimQuest(quest.id)
                  .then((result) => {
                    if (!result.isDuplicate) {
                      setToastMessage(copy.neuroPass.dailyQuests.toast(result.grantedAmount));
                    }
                  })
                  .catch(() => {
                    setToastMessage(null);
                  })
                  .finally(() => {
                    setClaimingQuestId((current) => (current === quest.id ? null : current));
                  });
              }}
              style={styles.claimButton}
            >
              {claimed
                ? copy.neuroPass.dailyQuests.claimed
                : pending
                  ? copy.neuroPass.dailyQuests.claiming
                  : copy.neuroPass.dailyQuests.claim}
            </PrimaryButton>
          </View>
        );
      })}
    </Card>
  );
}

export const NeuroPassDailyQuestsCard = memo(NeuroPassDailyQuestsCardComponent);

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.xs,
    },
    kicker: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    questRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    questMeta: {
      flex: 1,
      gap: 2,
    },
    questTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    questBody: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    rewardLabel: {
      color: theme.colors.brand,
      ...theme.typography.caption,
    },
    claimButton: {
      minWidth: 100,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    toast: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
      paddingVertical: 3,
      paddingHorizontal: theme.spacing.sm,
    },
    toastText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
  });
}
