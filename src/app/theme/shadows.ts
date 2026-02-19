type ThemeMode = 'light' | 'dark';

export function createShadows(mode: ThemeMode) {
  const isDark = mode === 'dark';

  return {
    card: {
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.36 : 0.16,
      shadowRadius: isDark ? 22 : 14,
      shadowOffset: {
        width: 0,
        height: isDark ? 10 : 8,
      },
      elevation: isDark ? 6 : 4,
    },
    button: {
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.28 : 0.2,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      elevation: 3,
    },
  } as const;
}
