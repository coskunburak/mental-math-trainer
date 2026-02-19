import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';

export function ThemeModeSwitch() {
  const { mode, setMode, theme } = useAppTheme();
  const { language, setLanguage, copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        <ModeButton
          label={copy.controls.light}
          active={mode === 'light'}
          onPress={() => setMode('light')}
          styles={styles}
        />
        <ModeButton
          label={copy.controls.dark}
          active={mode === 'dark'}
          onPress={() => setMode('dark')}
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, active && styles.activeButton, pressed && styles.pressed]}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    container: {
      gap: 6,
      alignItems: 'flex-end',
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
  });
}
