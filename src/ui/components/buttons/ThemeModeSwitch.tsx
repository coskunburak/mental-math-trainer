import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { useThemeCatalogView } from '@features/theme/presentation/useThemeCatalogView';

export function ThemeModeSwitch() {
  const { modePreference, setMode, setModePreference, theme } = useAppTheme();
  const { selectedTheme, lockedThemeCount, nextLockedPremiumThemeName, cycleTheme } =
    useThemeCatalogView();
  const { language, setLanguage, copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const categoryLabel =
    selectedTheme.category === 'free'
      ? copy.themeShowcase.category.free
      : selectedTheme.category === 'premium'
        ? copy.themeShowcase.category.premium
        : selectedTheme.category === 'seasonal'
          ? copy.themeShowcase.category.seasonal
          : selectedTheme.category === 'limited'
            ? copy.themeShowcase.category.limited
            : copy.themeShowcase.category.collab;

  const lockedHint =
    nextLockedPremiumThemeName == null
      ? copy.controls.lockedPremiumThemeHint(copy.themeShowcase.category.premium)
      : copy.controls.lockedPremiumThemeHint(nextLockedPremiumThemeName);

  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        <ModeButton
          label={copy.controls.light}
          active={modePreference === 'light'}
          onPress={() => setMode('light')}
          styles={styles}
        />
        <ModeButton
          label={copy.controls.dark}
          active={modePreference === 'dark'}
          onPress={() => setMode('dark')}
          styles={styles}
        />
        <ModeButton
          label={copy.controls.auto}
          active={modePreference === 'system'}
          onPress={() => setModePreference('system')}
          styles={styles}
        />
      </View>
      <View style={styles.wrap}>
        <ModeButton
          label={copy.controls.english}
          active={language === 'en'}
          onPress={() => setLanguage('en')}
          styles={styles}
        />
        <ModeButton
          label={copy.controls.turkish}
          active={language === 'tr'}
          onPress={() => setLanguage('tr')}
          styles={styles}
        />
      </View>

      <View style={styles.themeWrap}>
        <Pressable
          onPress={() => cycleTheme(-1)}
          style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
        >
          <Text style={styles.arrowText}>{'<'}</Text>
        </Pressable>

        <View style={styles.themeMetaWrap}>
          <Text style={styles.themeName}>{selectedTheme.name}</Text>
          <Text style={styles.themeMeta}>{categoryLabel.toUpperCase()}</Text>
          <View style={styles.gradientPreview}>
            {selectedTheme.backgroundGradient.map((color, index) => (
              <View
                key={`${selectedTheme.id}-${index}`}
                style={[styles.gradientDot, { backgroundColor: color }]}
              />
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => cycleTheme(1)}
          style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
        >
          <Text style={styles.arrowText}>{'>'}</Text>
        </Pressable>
      </View>

      {lockedThemeCount > 0 && (
        <Text style={styles.lockedHint}>
          {copy.controls.lockedThemesHint(lockedThemeCount, lockedHint)}
        </Text>
      )}
    </View>
  );
}

interface ModeButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function ModeButton({ label, active, onPress, styles }: ModeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.activeButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    container: {
      gap: 6,
      alignItems: 'flex-end',
      maxWidth: 320,
    },
    wrap: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 4,
      alignSelf: 'flex-start',
    },
    button: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: theme.radius.pill,
    },
    activeButton: {
      backgroundColor: theme.colors.brand,
    },
    pressed: {
      opacity: 0.8,
    },
    text: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    activeText: {
      color: theme.colors.surfaceStrong,
    },
    themeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 6,
      alignSelf: 'stretch',
      minWidth: 240,
      maxWidth: 320,
    },
    themeMetaWrap: {
      flex: 1,
      gap: 2,
    },
    themeName: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    themeMeta: {
      color: theme.colors.textTertiary,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
    },
    gradientPreview: {
      marginTop: 2,
      flexDirection: 'row',
      gap: 4,
    },
    gradientDot: {
      width: 9,
      height: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    arrowButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    arrowText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
      fontSize: 13,
      lineHeight: 14,
    },
    lockedHint: {
      color: theme.colors.textTertiary,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
      textAlign: 'right',
      maxWidth: 320,
    },
  });
}
