import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { StoreLogo } from "@/components/StoreLogo";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToList?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, onPress, onAddToList }: ProductCardProps) {
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

  const availablePrices = product.prices.filter((p) => p.available);
  const priceCount = availablePrices.length;
  const highestPrice = Math.max(...product.prices.map((p) => p.price));
  const savings = highestPrice - product.lowestPrice;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: "#FFFFFF", borderColor: "#E0E0E0" },
        animatedStyle,
      ]}
      testID={`card-product-${product.id}`}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText type="h4" numberOfLines={2} style={[styles.title, { color: "#1A1A1A" }]}>
              {product.name}
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.category, { color: "#666666" }]}
            >
              {product.category}
            </ThemedText>
          </View>
          {onAddToList ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAddToList();
              }}
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              hitSlop={8}
              testID={`button-add-${product.id}`}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <StoreLogo storeName={product.lowestPriceStore} size={28} />
              <View style={styles.priceInfo}>
                <ThemedText
                  style={[styles.lowestPrice, { color: theme.success }]}
                >
                  {formatPrice(product.lowestPrice)}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.storeText, { color: "#444444" }]}
                >
                  {product.lowestPriceStore}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.metaContainer}>
            {savings > 0.01 ? (
              <View style={[styles.savingsBadge, { backgroundColor: theme.primary + "15" }]}>
                <Feather name="trending-down" size={12} color={theme.primary} />
                <ThemedText
                  type="small"
                  style={[styles.savingsText, { color: theme.primary }]}
                >
                  Bespaar {formatPrice(savings)}
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.storeLogos}>
              {availablePrices.slice(0, 5).map((price, index) => (
                <View
                  key={price.storeId}
                  style={[
                    styles.miniLogoWrapper,
                    { marginLeft: index === 0 ? 0 : -6 },
                  ]}
                >
                  <StoreLogo storeName={price.storeName} size={20} />
                </View>
              ))}
              {priceCount > 5 ? (
                <View style={[styles.moreStores, { backgroundColor: theme.backgroundRoot }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    +{priceCount - 5}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  category: {
    textTransform: "capitalize",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInfo: {
    marginLeft: Spacing.sm,
  },
  lowestPrice: {
    fontSize: Typography.priceSmall.fontSize,
    fontWeight: Typography.priceSmall.fontWeight,
    lineHeight: Typography.priceSmall.fontSize * 1.1,
  },
  storeText: {
    fontWeight: "500",
    marginTop: 2,
  },
  metaContainer: {
    alignItems: "flex-end",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  savingsText: {
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  storeLogos: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniLogoWrapper: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 6,
  },
  moreStores: {
    marginLeft: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
