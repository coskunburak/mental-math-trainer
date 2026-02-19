import { useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@app/theme';

interface ScreenProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}

export function Screen({ children, style, contentStyle, scrollable = true }: ScreenProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const reveal = useRef(new Animated.Value(0)).current;
  const blobTopMotion = useRef(new Animated.Value(0)).current;
  const blobMiddleMotion = useRef(new Animated.Value(0)).current;
  const blobBottomMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: theme.motion.slow,
      useNativeDriver: true,
    }).start();
  }, [reveal, theme.motion.slow]);

  useEffect(() => {
    const topLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobTopMotion, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
        }),
        Animated.timing(blobTopMotion, {
          toValue: 0,
          duration: 7000,
          useNativeDriver: true,
        }),
      ]),
    );

    const middleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobMiddleMotion, {
          toValue: 1,
          duration: 9200,
          useNativeDriver: true,
        }),
        Animated.timing(blobMiddleMotion, {
          toValue: 0,
          duration: 9200,
          useNativeDriver: true,
        }),
      ]),
    );

    const bottomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobBottomMotion, {
          toValue: 1,
          duration: 8200,
          useNativeDriver: true,
        }),
        Animated.timing(blobBottomMotion, {
          toValue: 0,
          duration: 8200,
          useNativeDriver: true,
        }),
      ]),
    );

    topLoop.start();
    middleLoop.start();
    bottomLoop.start();

    return () => {
      topLoop.stop();
      middleLoop.stop();
      bottomLoop.stop();
    };
  }, [blobBottomMotion, blobMiddleMotion, blobTopMotion]);

  const revealStyle = {
    opacity: reveal,
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  } as const;

  const blobTopStyle = {
    transform: [
      {
        translateX: blobTopMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 20],
        }),
      },
      {
        translateY: blobTopMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 18],
        }),
      },
      {
        scale: blobTopMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.09],
        }),
      },
    ],
  } as const;

  const blobMiddleStyle = {
    transform: [
      {
        translateX: blobMiddleMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
      {
        translateY: blobMiddleMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -16],
        }),
      },
      {
        scale: blobMiddleMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.12],
        }),
      },
    ],
  } as const;

  const blobBottomStyle = {
    transform: [
      {
        translateX: blobBottomMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      },
      {
        translateY: blobBottomMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        }),
      },
      {
        scale: blobBottomMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.07],
        }),
      },
    ],
  } as const;

  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.decorLayer}>
        <Animated.View style={[styles.blobTop, blobTopStyle]} />
        <Animated.View style={[styles.blobMiddle, blobMiddleStyle]} />
        <Animated.View style={[styles.blobBottom, blobBottomStyle]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.foreground, revealStyle]}>
          {scrollable ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.fixedContent, contentStyle]}>{children}</View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    decorLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    blobTop: {
      position: 'absolute',
      width: 360,
      height: 360,
      borderRadius: 360,
      backgroundColor: theme.colors.blobTop,
      top: -190,
      left: -120,
    },
    blobMiddle: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 280,
      backgroundColor: theme.colors.blobMiddle,
      top: 220,
      right: -120,
    },
    blobBottom: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 340,
      backgroundColor: theme.colors.blobBottom,
      bottom: -220,
      left: -100,
    },
    foreground: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: theme.spacing.xxxl,
      paddingBottom: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    fixedContent: {
      flex: 1,
      paddingTop: theme.spacing.xxxl,
      paddingBottom: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
  });
}
