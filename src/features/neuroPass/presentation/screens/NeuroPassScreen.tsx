import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { NeuroPassSkuBuilder } from '@features/neuroPass/domain/iap/NeuroPassSkus';
import type { NeuroPassInventory } from '@features/neuroPass/domain/entities/NeuroPassInventory';
import {
  NeuroPassStore,
  type NeuroPassUiMessage,
} from '@features/neuroPass/presentation/store/neuroPassStore';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

import { NeuroPassProgressHeader } from '../components/NeuroPassProgressHeader';
import { NeuroPassPurchaseSheet } from '../components/NeuroPassPurchaseSheet';
import { NeuroPassRetroClaimModal } from '../components/NeuroPassRetroClaimModal';
import { NeuroPassStateBadge } from '../components/NeuroPassStateBadge';
import { NeuroPassQuestsCard } from '../components/NeuroPassQuestsCard';
import { NeuroPassTierSkipBar } from '../components/NeuroPassTierSkipBar';
import { NeuroPassTrackRail } from '../components/NeuroPassTrackRail';
import { CatchUpOfferCard } from '../components/CatchUpOfferCard';
import { UrgencyBar } from '../components/UrgencyBar';
import { NeuroPassEconomyTuningScreen } from './NeuroPassEconomyTuningScreen';

interface NeuroPassScreenProps {
  store: NeuroPassStore;
  onBack: () => void;
  onInventoryChanged?: (inventory: NeuroPassInventory) => void;
}

const skuBuilder = new NeuroPassSkuBuilder();

export function NeuroPassScreen({ store, onBack, onInventoryChanged }: NeuroPassScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [debugTapCount, setDebugTapCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );
  const purchaseMessage = resolveNeuroPassMessage(copy, state.purchaseMessage);

  useEffect(() => {
    void store.load();
  }, [store]);

  useEffect(() => {
    if (!state.purchaseMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      store.clearMessage();
    }, 1800);

    return () => clearTimeout(timeout);
  }, [state.purchaseMessage, store]);

  useEffect(() => {
    onInventoryChanged?.(state.inventory);
  }, [onInventoryChanged, state.inventory]);

  if (__DEV__ && showDebug) {
    return (
      <NeuroPassEconomyTuningScreen
        config={store.getEconomyConfig()}
        onSimulate={(input) => store.runSimulation(input)}
        onClose={() => setShowDebug(false)}
      />
    );
  }

  if (state.phase === 'loading' && state.dashboard.status !== 'ready') {
    return (
      <Screen scrollable={false} contentStyle={styles.content}>
        <Card tone="accent" style={styles.centerCard}>
          <Text style={styles.title}>{copy.neuroPass.screen.loadingTitle}</Text>
          <Text style={styles.body}>{copy.neuroPass.screen.loadingBody}</Text>
        </Card>
        <PrimaryButton onPress={onBack} variant="secondary">
          {copy.common.back}
        </PrimaryButton>
      </Screen>
    );
  }

  if (state.dashboard.status === 'unavailable' || !state.dashboard.season) {
    return (
      <Screen scrollable={false} contentStyle={styles.content}>
        <Card tone="accent" style={styles.centerCard}>
          <Text style={styles.title}>{copy.neuroPass.screen.unavailableTitle}</Text>
          <Text style={styles.body}>{copy.neuroPass.screen.unavailableBody}</Text>
          <NeuroPassStateBadge state={state.dashboard.state} />
        </Card>
        <PrimaryButton onPress={onBack} variant="secondary">
          {copy.common.back}
        </PrimaryButton>
      </Screen>
    );
  }

  const seasonId = state.dashboard.season.id;
  const standardSku = skuBuilder.buildStandardSku(seasonId);
  const plusSku = skuBuilder.buildPlusSku(seasonId);

  const standardProduct = state.iapProducts[standardSku];
  const plusProduct = state.iapProducts[plusSku];

  return (
    <Screen contentStyle={styles.content}>
      {purchaseMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{purchaseMessage}</Text>
        </View>
      ) : null}

      <NeuroPassProgressHeader
        dashboard={state.dashboard}
        onSecretLongPress={() => {
          if (!__DEV__) {
            return;
          }

          setDebugTapCount((previous) => {
            const next = previous + 1;
            if (next >= 5) {
              setShowDebug(true);
              return 0;
            }
            return next;
          });
        }}
      />

      {state.urgency.visible ? (
        <UrgencyBar
          hoursLeft={state.urgency.hoursLeft}
          ratioToDeadline={state.urgency.ratioToDeadline}
        />
      ) : null}

      {!state.dashboard.entitlement.premiumOwned ? (
        <PrimaryButton onPress={() => store.openPurchaseSheet('screen_cta')}>
          {copy.neuroPass.screen.unlockPremium}
        </PrimaryButton>
      ) : null}

      {state.catchUpOffer.visible ? (
        <CatchUpOfferCard
          tiersLeft={state.catchUpOffer.tiersLeft}
          disabled={state.isPurchaseBusy}
          onOpenPurchase={() => store.openPurchaseSheet('screen_cta')}
        />
      ) : null}

      <NeuroPassTierSkipBar
        balance={state.dashboard.tierSkipsBalance}
        dayCount={state.tierSkipDayCount}
        disabled={state.isPurchaseBusy}
        onUseOne={() => {
          void store.useSkip(1);
        }}
        onUseFive={() => {
          void store.useSkip(5);
        }}
        onPurchaseFive={() => {
          void store.purchaseSkip5();
        }}
      />

      <View style={styles.railWrap}>
        <NeuroPassTrackRail
          seasonId={state.dashboard.season.id}
          tiers={state.dashboard.tiers}
          premiumOwned={state.dashboard.entitlement.premiumOwned}
          claimedRewardKeys={state.claimedRewardKeys}
          claimingTierKey={state.claimingTierKey}
          onClaimTier={(tierIndex, track) => {
            void store.claimTier(tierIndex, track);
          }}
          onLockedPremiumPress={() => store.openPurchaseSheet('tier_locked')}
        />
      </View>

      <NeuroPassQuestsCard
        dashboard={state.quests}
        loading={state.questsLoading}
        onClaimQuest={(period, questId) => store.claimQuest(period, questId)}
      />

      <PrimaryButton
        variant="secondary"
        onPress={() => {
          void store.restorePurchases();
        }}
      >
        {copy.neuroPass.screen.restorePurchases}
      </PrimaryButton>

      <PrimaryButton onPress={onBack} variant="secondary">
        {copy.common.back}
      </PrimaryButton>

      {__DEV__ ? (
        <PrimaryButton variant="secondary" onPress={() => setShowDebug(true)}>
          {copy.neuroPass.screen.devEconomyTuning}
        </PrimaryButton>
      ) : null}

      <NeuroPassPurchaseSheet
        visible={state.isPurchaseSheetVisible}
        loading={state.isPurchaseBusy}
        standard={{
          sku: standardSku,
          title: copy.neuroPass.screen.standardOfferTitle,
          subtitle: copy.neuroPass.screen.standardOfferSubtitle,
          localizedPrice: standardProduct?.localizedPrice ?? '$8.99',
        }}
        plus={{
          sku: plusSku,
          title: copy.neuroPass.screen.plusOfferTitle,
          subtitle: copy.neuroPass.screen.plusOfferSubtitle,
          localizedPrice: plusProduct?.localizedPrice ?? '$14.99',
        }}
        onBuyStandard={() => {
          void store.purchasePass('standard');
        }}
        onBuyPlus={() => {
          void store.purchasePass('plus');
        }}
        onRestore={() => {
          void store.restorePurchases();
        }}
        onClose={() => store.closePurchaseSheet()}
      />

      <NeuroPassRetroClaimModal
        visible={state.retroClaimVisible}
        result={state.retroClaimResult}
        onDismiss={() => store.dismissRetroClaimModal()}
      />
    </Screen>
  );
}

function resolveNeuroPassMessage(
  copy: ReturnType<typeof useLocalization>['copy'],
  message: NeuroPassUiMessage | null,
): string | null {
  if (!message) {
    return null;
  }

  switch (message.type) {
    case 'purchase_cancelled':
      return copy.neuroPass.messages.purchaseCancelled;
    case 'purchase_failed':
      return copy.neuroPass.messages.purchaseFailed;
    case 'no_purchases_to_restore':
      return copy.neuroPass.messages.noPurchasesToRestore;
    case 'purchases_restored':
      return copy.neuroPass.messages.purchasesRestored;
    case 'daily_limit_reached_skip5':
      return copy.neuroPass.messages.dailyLimitReachedSkip5;
    case 'skip5_added':
      return copy.neuroPass.messages.skip5Added;
    case 'season_already_maxed':
      return copy.neuroPass.messages.seasonAlreadyMaxed;
    case 'not_enough_skips':
      return copy.neuroPass.messages.notEnoughSkips;
    case 'used_skips':
      return copy.neuroPass.messages.usedSkips(message.count);
    case 'tier_claimed':
      return copy.neuroPass.messages.tierClaimed(
        copy.neuroPass.rewardTitle(message.rewardTitle),
        message.coinsDelta,
        message.totalCoins,
      );
    case 'tier_already_claimed':
      return copy.neuroPass.messages.tierAlreadyClaimed;
    case 'tier_locked':
      return copy.neuroPass.messages.tierLocked;
    case 'premium_required':
      return copy.neuroPass.messages.premiumRequired;
    default:
      return null;
  }
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    content: {
      paddingTop: theme.spacing.xxl,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    centerCard: {
      gap: theme.spacing.xs,
    },
    railWrap: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xs,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    body: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
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
