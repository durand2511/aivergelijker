import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { StoreLogo } from "@/components/StoreLogo";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ProductPrice } from "@/types/product";

interface PriceComparisonRowProps {
  price: ProductPrice;
  isLowest: boolean;
}

export function PriceComparisonRow({ price, isLowest }: PriceComparisonRowProps) {
  const { theme } = useTheme();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLowest ? theme.success + "10" : theme.backgroundDefault },
        { borderColor: isLowest ? theme.success : theme.cardBorder },
      ]}
    >
      <View style={styles.storeSection}>
        <StoreLogo storeName={price.storeName} size={40} />
        <View style={styles.storeInfo}>
          <ThemedText type="body" style={styles.storeName}>
            {price.storeName}
          </ThemedText>
          {price.pricePerUnit ? (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              {price.pricePerUnit}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.priceSection}>
        {isLowest ? (
          <View style={[styles.lowestBadge, { backgroundColor: theme.success }]}>
            <Feather name="check" size={12} color="#FFFFFF" />
            <ThemedText type="small" style={styles.lowestText}>
              Laagste
            </ThemedText>
          </View>
        ) : null}
        <ThemedText
          style={[
            styles.price,
            { color: isLowest ? theme.success : theme.text },
          ]}
        >
          {formatPrice(price.price)}
        </ThemedText>
        {!price.available ? (
          <ThemedText
            type="small"
            style={[styles.unavailable, { color: theme.error }]}
          >
            Niet beschikbaar
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  storeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeInfo: {
    marginLeft: Spacing.md,
  },
  storeName: {
    fontWeight: "500",
  },
  priceSection: {
    alignItems: "flex-end",
  },
  lowestBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  lowestText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
  },
  unavailable: {
    marginTop: 2,
  },
});
