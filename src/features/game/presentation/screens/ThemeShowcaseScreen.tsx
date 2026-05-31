import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { SubscriptionTier } from '@features/game/domain/entities/Monetization';
import type { GameThemeDefinition, ThemeAccessResult, ThemeCategory } from '@features/theme';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

type ThemeCategoryFilter = 'all' | ThemeCategory;

const FILTER_ORDER: ThemeCategoryFilter[] = [
  'all',
  'free',
  'premium',
  'seasonal',
  'limited',
  'collab',
];

interface ThemeShowcaseScreenProps {
  tier: SubscriptionTier;
  onUpgrade: () => void;
  onThemeSelected?: (themeId: string, category: ThemeCategory) => void;
  onThemeUpsellPressed?: (themeId: string, category: ThemeCategory) => void;
  onBack: () => void;
}

export function ThemeShowcaseScreen({
  tier,
  onUpgrade,
  onThemeSelected,
  onThemeUpsellPressed,
  onBack,
}: ThemeShowcaseScreenProps) {
  const { theme, themes, selectedThemeId, selectTheme, getThemeAccess, unlockedThemes } =
    useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [filter, setFilter] = useState<ThemeCategoryFilter>('all');

  const topReveal = useRef(new Animated.Value(0)).current;
  const heroReveal = useRef(new Animated.Value(0)).current;
  const filterReveal = useRef(new Animated.Value(0)).current;
  const gridReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = [topReveal, heroReveal, filterReveal, gridReveal];
    sequence.forEach((value) => value.setValue(0));

    Animated.stagger(
      90,
      sequence.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          tension: 90,
          friction: 10,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [filterReveal, gridReveal, heroReveal, topReveal]);

  const filteredThemes = useMemo(() => {
    if (filter === 'all') {
      return themes;
    }

    return themes.filter((entry) => entry.category === filter);
  }, [filter, themes]);

  return (
    <Screen>
      <Animated.View style={[revealStyle(topReveal, 14), styles.topRow]}>
        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>{copy.themeShowcase.kicker}</Text>
          <Text style={styles.title}>{copy.themeShowcase.title}</Text>
        </View>
        <ThemeModeSwitch />
      </Animated.View>

      <Animated.View style={revealStyle(heroReveal, 20)}>
        <Card tone="accent" style={styles.heroCard}>
          <Text style={styles.heroBody}>{copy.themeShowcase.subtitle}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricText}>
                {copy.themeShowcase.unlockedThemes(unlockedThemes.length, themes.length)}
              </Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricText}>
                {copy.themeShowcase.activeTheme(
                  themes.find((entry) => entry.id === selectedThemeId)?.name ?? 'N/A',
                )}
              </Text>
            </View>
          </View>

          {tier === 'free' && (
            <PrimaryButton onPress={onUpgrade}>{copy.themeShowcase.unlockPremium}</PrimaryButton>
          )}
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(filterReveal, 24)}>
        <Card style={styles.filterCard}>
          <View style={styles.filterRow}>
            {FILTER_ORDER.map((category) => (
              <CategoryChip
                key={category}
                label={labelForCategory(category, copy)}
                active={filter === category}
                onPress={() => setFilter(category)}
                styles={styles}
              />
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(gridReveal, 28)}>
        <View style={styles.themeGrid}>
          {filteredThemes.map((themeEntry) => {
            const access = getThemeAccess(themeEntry.id);
            const isSelected = selectedThemeId === themeEntry.id;
            const canUpgrade =
              !access.unlocked &&
              tier === 'free' &&
              (themeEntry.category === 'premium' ||
                access.reason.toLowerCase().includes('premium'));

            return (
              <ThemeMarketingCard
                key={themeEntry.id}
                themeEntry={themeEntry}
                access={access}
                selected={isSelected}
                canUpgrade={canUpgrade}
                onSelect={() => {
                  selectTheme(themeEntry.id);
                  onThemeSelected?.(themeEntry.id, themeEntry.category);
                }}
                onUpgrade={() => {
                  onThemeUpsellPressed?.(themeEntry.id, themeEntry.category);
                  onUpgrade();
                }}
                styles={styles}
                copy={copy}
              />
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <PrimaryButton onPress={onBack} variant="secondary">
          {copy.common.back}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

interface CategoryChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function CategoryChip({ label, active, onPress, styles }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.filterChipPressed,
      ]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

interface ThemeMarketingCardProps {
  themeEntry: GameThemeDefinition;
  access: ThemeAccessResult;
  selected: boolean;
  canUpgrade: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
  styles: ReturnType<typeof createStyles>;
  copy: ReturnType<typeof useLocalization>['copy'];
}

function ThemeMarketingCard({
  themeEntry,
  access,
  selected,
  canUpgrade,
  onSelect,
  onUpgrade,
  styles,
  copy,
}: ThemeMarketingCardProps) {
  return (
    <Card style={styles.themeCard} tone="accent">
      <View style={styles.themeHeader}>
        <Text style={styles.themeName}>{themeEntry.name}</Text>
        <View style={styles.badgeWrap}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {labelForCategory(themeEntry.category, copy)}
            </Text>
          </View>
          {!access.unlocked && (
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>{copy.themeShowcase.lockedReason}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.paletteRow}>
        <PaletteSwatch label="P" color={themeEntry.primaryColor} styles={styles} />
        <PaletteSwatch label="S" color={themeEntry.secondaryColor} styles={styles} />
        <PaletteSwatch label="A" color={themeEntry.accentColor} styles={styles} />
        <PaletteSwatch label="OK" color={themeEntry.successColor} styles={styles} />
        <PaletteSwatch label="ERR" color={themeEntry.errorColor} styles={styles} />
        <PaletteSwatch label="UI" color={themeEntry.surfaceColor} styles={styles} />
      </View>

      <View style={styles.gradientStrip}>
        {themeEntry.backgroundGradient.map((color, index) => (
          <View
            key={`${themeEntry.id}-gradient-${index}`}
            style={[styles.gradientSegment, { backgroundColor: color }]}
          />
        ))}
      </View>

      <View style={styles.systemRow}>
        <Text style={styles.systemLabel}>{copy.themeShowcase.visualSystem}</Text>
        <Text style={styles.systemValue}>
          {themeEntry.hudStyle.toUpperCase()} | {themeEntry.animationStyle.toUpperCase()} |{' '}
          {themeEntry.typographyStyle.toUpperCase()}
        </Text>
      </View>

      <View style={styles.systemRow}>
        <Text style={styles.systemLabel}>{copy.themeShowcase.audioSystem}</Text>
        <Text style={styles.systemValue}>
          {themeEntry.soundPack} | {themeEntry.particleEffectType}
        </Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaTitle}>{copy.themeShowcase.emotionalFeel}</Text>
        <Text style={styles.metaBody}>{themeEntry.marketing.emotionalFeel}</Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaTitle}>{copy.themeShowcase.animationBehavior}</Text>
        <Text style={styles.metaBody}>
          {themeEntry.animationStyle.toUpperCase()} motion profile for punchy feedback and session
          rhythm.
        </Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaTitle}>{copy.themeShowcase.targetPersona}</Text>
        <Text style={styles.metaBody}>{themeEntry.marketing.targetPersona}</Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaTitle}>{copy.themeShowcase.tagline}</Text>
        <Text style={styles.metaBodyStrong}>{themeEntry.marketing.tagline}</Text>
      </View>

      <View style={styles.marketingBlock}>
        <Text style={styles.marketingTitle}>{copy.themeShowcase.marketingAssets}</Text>

        <Text style={styles.marketingLabel}>{copy.themeShowcase.appStoreConcept}</Text>
        <Text style={styles.marketingBody}>{themeEntry.marketing.appStoreConcept}</Text>

        <Text style={styles.marketingLabel}>{copy.themeShowcase.instagramStory}</Text>
        <Text style={styles.marketingBody}>{themeEntry.marketing.instagramStoryIdea}</Text>

        <Text style={styles.marketingLabel}>{copy.themeShowcase.beforeAfter}</Text>
        <Text style={styles.marketingBody}>{themeEntry.marketing.beforeAfterConcept}</Text>

        <Text style={styles.marketingLabel}>{copy.themeShowcase.adCopy}</Text>
        <Text style={styles.marketingBodyStrong}>{themeEntry.marketing.sampleAdCopy}</Text>
      </View>

      {!access.unlocked && <Text style={styles.lockReason}>• {access.reason}</Text>}

      {access.unlocked ? (
        <PrimaryButton onPress={onSelect} variant={selected ? 'secondary' : 'brand'}>
          {selected ? copy.themeShowcase.selectedTheme : copy.themeShowcase.selectTheme}
        </PrimaryButton>
      ) : canUpgrade ? (
        <PrimaryButton onPress={onUpgrade}>{copy.themeShowcase.unlockPremium}</PrimaryButton>
      ) : (
        <PrimaryButton variant="secondary" disabled>
          {access.reason}
        </PrimaryButton>
      )}
    </Card>
  );
}

interface PaletteSwatchProps {
  label: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
}

function PaletteSwatch({ label, color, styles }: PaletteSwatchProps) {
  return (
    <View style={styles.swatchItem}>
      <View style={[styles.swatchColor, { backgroundColor: color }]} />
      <Text style={styles.swatchLabel}>{label}</Text>
      <Text style={styles.swatchHex}>{color.toUpperCase()}</Text>
    </View>
  );
}

function labelForCategory(
  category: ThemeCategoryFilter,
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  if (category === 'all') {
    return copy.themeShowcase.category.all;
  }

  return copy.themeShowcase.category[category];
}

function revealStyle(value: Animated.Value, fromY: number) {
  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
        }),
      },
    ],
  } as const;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    titleWrap: {
      flex: 1,
      gap: 2,
    },
    kicker: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
    },
    heroCard: {
      gap: theme.spacing.md,
    },
    heroBody: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    metricPill: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.pill,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
    },
    metricText: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    filterCard: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    filterChip: {
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    filterChipActive: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    filterChipPressed: {
      transform: [{ scale: 0.98 }],
    },
    filterChipText: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    filterChipTextActive: {
      color: theme.colors.brand,
    },
    themeGrid: {
      gap: theme.spacing.md,
    },
    themeCard: {
      gap: theme.spacing.sm,
    },
    themeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    themeName: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
      flex: 1,
    },
    badgeWrap: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      maxWidth: 170,
    },
    categoryBadge: {
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    categoryBadgeText: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
      fontSize: 10,
      lineHeight: 12,
    },
    lockBadge: {
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.accentSoft,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    lockBadgeText: {
      color: theme.colors.danger,
      ...theme.typography.caption,
      fontSize: 10,
      lineHeight: 12,
    },
    paletteRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    swatchItem: {
      minWidth: 82,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xs,
      gap: 2,
    },
    swatchColor: {
      height: 18,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    swatchLabel: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
      fontSize: 10,
      lineHeight: 12,
    },
    swatchHex: {
      color: theme.colors.textPrimary,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: '700',
    },
    gradientStrip: {
      flexDirection: 'row',
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      height: 18,
    },
    gradientSegment: {
      flex: 1,
    },
    systemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    systemLabel: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
      flex: 1,
    },
    systemValue: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
      textAlign: 'right',
      flex: 1,
    },
    metaBlock: {
      gap: 3,
    },
    metaTitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    metaBody: {
      color: theme.colors.textPrimary,
      ...theme.typography.body,
    },
    metaBodyStrong: {
      color: theme.colors.brand,
      ...theme.typography.subtitle,
    },
    marketingBlock: {
      gap: 2,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
    marketingTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
      marginBottom: 2,
    },
    marketingLabel: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    marketingBody: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      marginBottom: theme.spacing.xs,
    },
    marketingBodyStrong: {
      color: theme.colors.accent,
      ...theme.typography.subtitle,
    },
    lockReason: {
      color: theme.colors.danger,
      ...theme.typography.caption,
    },
    actions: {
      marginTop: theme.spacing.sm,
    },
  });
}
