import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, ImageBackground, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { PriceComparisonRow } from "@/components/PriceComparisonRow";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ListPickerModal } from "@/components/ListPickerModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Product } from "@/types/product";
import { SearchStackParamList } from "@/navigation/SearchStackNavigator";
import { apiRequest } from "@/lib/query-client";

import kiwiBackground from "../../assets/images/kiwi-background.png";

type ProductDetailRouteProp = RouteProp<SearchStackParamList, "ProductDetail">;

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation();
  const { productId, product: passedProduct } = route.params;

  const [product, setProduct] = useState<Product | null>(passedProduct || null);
  const [isLoading, setIsLoading] = useState(!passedProduct);
  const [listPickerVisible, setListPickerVisible] = useState(false);

  useEffect(() => {
    if (!passedProduct) {
      loadProduct();
    }
  }, [productId, passedProduct]);

  const loadProduct = async () => {
    try {
      const response = await apiRequest("GET", `/api/products/${productId}`);
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToList = () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setListPickerVisible(true);
  };

  const handleCloseListPicker = () => {
    setListPickerVisible(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (isLoading) {
    return (
      <ImageBackground
        source={kiwiBackground}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 60 }]}>
          <LoadingSkeleton count={1} />
        </View>
      </ImageBackground>
    );
  }

  if (!product) {
    return (
      <ImageBackground
        source={kiwiBackground}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={[styles.errorContainer, { paddingTop: insets.top + 60 }]}>
          <Text style={styles.errorText}>Product niet gevonden</Text>
        </View>
      </ImageBackground>
    );
  }

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedPrices[0]?.price || 0;
  const highestPrice = sortedPrices[sortedPrices.length - 1]?.price || 0;
  const savings = highestPrice - lowestPrice;

  return (
    <ImageBackground
      source={kiwiBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: tabBarHeight + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>Laagste prijs</Text>
              <Text style={styles.summaryPrice}>{formatPrice(product.lowestPrice)}</Text>
            </View>
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>{product.lowestPriceStore}</Text>
            </View>
          </View>
          {savings > 0.01 ? (
            <View style={styles.savingsRow}>
              <Feather name="trending-down" size={16} color="#1A1A1A" />
              <Text style={styles.savingsText}>
                Bespaar tot {formatPrice(savings)} t.o.v. andere winkels
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.pricesSection}>
          <Text style={styles.sectionTitle}>Alle prijzen</Text>
          {sortedPrices.map((price, index) => (
            <PriceComparisonRow
              key={price.storeId}
              price={price}
              isLowest={index === 0}
            />
          ))}
        </View>

        <Pressable
          onPress={handleAddToList}
          style={styles.addButton}
          testID="button-add-to-list"
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Toevoegen aan lijst</Text>
        </Pressable>
      </ScrollView>

      <ListPickerModal
        visible={listPickerVisible}
        onClose={handleCloseListPicker}
        product={product}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  productHeader: {
    marginBottom: Spacing.xl,
  },
  productName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  category: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "capitalize",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginBottom: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
    marginBottom: Spacing.xs,
  },
  summaryPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: "#22C55E",
  },
  storeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: "#22C55E",
  },
  storeBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  savingsText: {
    marginLeft: Spacing.sm,
    fontWeight: "600",
    color: "#1A1A1A",
    fontSize: 14,
  },
  pricesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.lg,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomBar: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: "#1A1A1A",
    marginTop: Spacing.lg,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
});
