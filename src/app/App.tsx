import { StatusBar } from 'expo-status-bar';
import {
  Component,
  type ContextType,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { bootstrapApp } from '@app/bootstrap';
import type { Container } from '@app/di/container';
import { LocalizationContext, LocalizationProvider, copyByLanguage, useLocalization } from '@app/i18n';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from '@app/theme';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Screen } from '@ui/components/layout/Screen';

export default function App() {
  return (
    <LocalizationProvider>
      <AppErrorBoundary>
        <ThemeProvider>
          <AppRoot />
        </ThemeProvider>
      </AppErrorBoundary>
    </LocalizationProvider>
  );
}

type BootstrapPhase = 'loading' | 'ready' | 'failed';

function AppRoot() {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [container, setContainer] = useState<Container | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [bootstrapPhase, setBootstrapPhase] = useState<BootstrapPhase>('loading');

  useEffect(() => {
    let active = true;
    setBootstrapPhase('loading');

    const timeoutId = setTimeout(() => {
      if (active) {
        setBootstrapPhase('failed');
        setContainer(null);
      }
    }, 8000);

    bootstrapApp()
      .then((nextContainer) => {
        if (active) {
          clearTimeout(timeoutId);
          setContainer(nextContainer);
          setBootstrapPhase('ready');
        }
      })
      .catch(() => {
        if (active) {
          clearTimeout(timeoutId);
          setBootstrapPhase('failed');
          setContainer(null);
        }
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [bootstrapAttempt]);

  if (bootstrapPhase === 'failed' || !container) {
    return (
      <Screen scrollable={false}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>
            {bootstrapPhase === 'failed'
              ? copy.app.failedToInitialize
              : copy.app.bootstrapping}
          </Text>
          {bootstrapPhase === 'failed' && (
            <PrimaryButton onPress={() => setBootstrapAttempt((attempt) => attempt + 1)}>
              {copy.app.retry}
            </PrimaryButton>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <RootNavigator container={container} />
    </>
  );
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  static contextType = LocalizationContext;

  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : '',
    };
  }

  componentDidCatch(error: unknown, _errorInfo: ErrorInfo): void {
    console.error('App runtime error:', error);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const localization = this.context as ContextType<typeof LocalizationContext>;
    const copy = localization?.copy ?? copyByLanguage.en;

    return (
      <View style={fallbackStyles.container}>
        <Text style={fallbackStyles.title}>{copy.app.somethingWentWrong}</Text>
        <Text style={fallbackStyles.message}>
          {this.state.message || copy.app.unexpectedRuntimeError}
        </Text>
      </View>
    );
  }
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      ...theme.typography.subtitle,
    },
  });
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1020',
    padding: 24,
    gap: 10,
  },
  title: {
    color: '#F4F7FF',
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: '#C9D3EE',
    fontSize: 14,
    textAlign: 'center',
  },
});
