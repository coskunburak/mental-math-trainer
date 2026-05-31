import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import {
  type ClaimQuestPeriod,
  type ClaimQuestXpResult,
} from '@features/neuroPass/domain/usecases/ClaimQuestXp';
import type { NeuroPassQuestsDashboard } from '@features/neuroPass/domain/usecases/LoadQuestsDashboard';
import { neuroPassQuestPeriod } from '@features/neuroPass/domain/quests/QuestTypes';
import { Card } from '@ui/components/layout/Card';

import { QuestRow } from './QuestRow';

type QuestTab = ClaimQuestPeriod;

interface NeuroPassQuestsCardProps {
  dashboard: NeuroPassQuestsDashboard;
  loading?: boolean;
  onClaimQuest: (period: ClaimQuestPeriod, questId: string) => Promise<ClaimQuestXpResult>;
}

function NeuroPassQuestsCardComponent({
  dashboard,
  loading = false,
  onClaimQuest,
}: NeuroPassQuestsCardProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState<QuestTab>(neuroPassQuestPeriod.daily);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 1700);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const rows = useMemo(() => {
    if (activeTab === neuroPassQuestPeriod.daily) {
      return dashboard.daily;
    }

    if (activeTab === neuroPassQuestPeriod.weekly) {
      return dashboard.weekly;
    }

    return dashboard.bossWeekly ? [dashboard.bossWeekly] : [];
  }, [activeTab, dashboard.bossWeekly, dashboard.daily, dashboard.weekly]);

  return (
    <Card style={styles.card}>
      <Text style={styles.kicker}>{copy.neuroPass.quests.kicker}</Text>
      <Text style={styles.title}>{copy.neuroPass.quests.title}</Text>
      <Text style={styles.subtitle}>{copy.neuroPass.quests.subtitle(dashboard.dailyKey, dashboard.weeklyKey)}</Text>

      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <View style={styles.tabsRow}>
        <QuestTabButton
          label={copy.neuroPass.quests.tabDaily}
          selected={activeTab === neuroPassQuestPeriod.daily}
          onPress={() => setActiveTab(neuroPassQuestPeriod.daily)}
          styles={styles}
        />
        <QuestTabButton
          label={copy.neuroPass.quests.tabWeekly}
          selected={activeTab === neuroPassQuestPeriod.weekly}
          onPress={() => setActiveTab(neuroPassQuestPeriod.weekly)}
          styles={styles}
        />
        <QuestTabButton
          label={copy.neuroPass.quests.tabBoss}
          selected={activeTab === neuroPassQuestPeriod.bossWeekly}
          onPress={() => setActiveTab(neuroPassQuestPeriod.bossWeekly)}
          styles={styles}
        />
      </View>

      <View style={styles.listWrap}>
        {rows.length === 0 ? (
          <Text style={styles.emptyText}>
            {loading ? copy.neuroPass.quests.loading : copy.neuroPass.quests.empty}
          </Text>
        ) : (
          rows.map((quest) => {
            const key = `${quest.period}:${quest.questId}`;
            return (
              <QuestRow
                key={key}
                quest={quest}
                disabled={loading}
                claiming={claimingKey === key}
                onClaim={(questId) => {
                  setClaimingKey(key);
                  void onClaimQuest(quest.period, questId)
                    .then((result) => {
                      if (!result.isDuplicate && !result.blocked) {
                        setToastMessage(copy.neuroPass.quests.toast(result.grantedAmount));
                      }
                    })
                    .catch(() => {
                      setToastMessage(null);
                    })
                    .finally(() => {
                      setClaimingKey((current) => (current === key ? null : current));
                  });
                }}
                localizedTitle={copy.neuroPass.quests.questText(quest.questId, quest.title, quest.description).title}
                localizedDescription={copy.neuroPass.quests.questText(quest.questId, quest.title, quest.description).description}
              />
            );
          })
        )}
      </View>
    </Card>
  );
}

function QuestTabButton({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        selected && styles.tabButtonSelected,
        pressed && styles.tabButtonPressed,
      ]}
    >
      <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export const NeuroPassQuestsCard = memo(NeuroPassQuestsCardComponent);

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
    tabsRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    tabButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 5,
      backgroundColor: theme.colors.surface,
    },
    tabButtonSelected: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    tabButtonPressed: {
      opacity: 0.85,
    },
    tabLabel: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    tabLabelSelected: {
      color: theme.colors.textPrimary,
    },
    listWrap: {
      gap: theme.spacing.xs,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
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
