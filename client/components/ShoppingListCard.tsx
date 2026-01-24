import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ShoppingList } from "@/types/product";

interface ShoppingListCardProps {
  list: ShoppingList;
  onPress: () => void;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ShoppingListCard({
  list,
  onPress,
  onDelete,
}: ShoppingListCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const itemCount = list.items.length;
  const formattedDate = new Date(list.updatedAt).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
        animatedStyle,
      ]}
      testID={`card-list-${list.id}`}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="shopping-bag" size={20} color={theme.primary} />
          </View>
          <View style={styles.titleContainer}>
            <ThemedText type="h4" numberOfLines={1}>
              {list.name}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.meta, { color: theme.textSecondary }]}
            >
              {itemCount} product{itemCount !== 1 ? "en" : ""} • {formattedDate}
            </ThemedText>
          </View>
          {onDelete ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              hitSlop={12}
              testID={`button-delete-list-${list.id}`}
            >
              <Feather name="trash-2" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Geschatte totaal
            </ThemedText>
            <ThemedText
              style={[styles.price, { color: theme.success }]}
            >
              {formatPrice(list.totalPrice)}
            </ThemedText>
          </View>
          {list.cheapestStore ? (
            <View style={[styles.storeBadge, { backgroundColor: theme.success + "15" }]}>
              <ThemedText
                type="small"
                style={[styles.storeText, { color: theme.success }]}
              >
                Goedkoopst: {list.cheapestStore}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  meta: {},
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {},
  price: {
    fontSize: Typography.priceSmall.fontSize,
    fontWeight: Typography.priceSmall.fontWeight,
  },
  storeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  storeText: {
    fontWeight: "600",
  },
});
