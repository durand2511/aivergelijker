import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface LoadingSkeletonProps {
  count?: number;
}

function SkeletonCard() {
  const { theme } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View
            style={[styles.titleLine, { backgroundColor: theme.backgroundTertiary }]}
          />
          <View
            style={[styles.subtitleLine, { backgroundColor: theme.backgroundTertiary }]}
          />
        </View>
        <View
          style={[styles.addButton, { backgroundColor: theme.backgroundTertiary }]}
        />
      </View>
      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <View
            style={[styles.priceLine, { backgroundColor: theme.backgroundTertiary }]}
          />
          <View
            style={[styles.storeLine, { backgroundColor: theme.backgroundTertiary }]}
          />
        </View>
        <View
          style={[styles.savingsLine, { backgroundColor: theme.backgroundTertiary }]}
        />
      </View>
    </Animated.View>
  );
}

export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  titleSection: {
    flex: 1,
    marginRight: Spacing.md,
  },
  titleLine: {
    height: 20,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
    width: "80%",
  },
  subtitleLine: {
    height: 14,
    borderRadius: BorderRadius.xs,
    width: "40%",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceSection: {},
  priceLine: {
    height: 24,
    width: 80,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  storeLine: {
    height: 24,
    width: 100,
    borderRadius: BorderRadius.xs,
  },
  savingsLine: {
    height: 24,
    width: 120,
    borderRadius: BorderRadius.xs,
  },
});
