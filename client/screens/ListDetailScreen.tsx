import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ImageBackground,
  Text,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute, RouteProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ShoppingList, ShoppingListItem, STORES, StoreRecommendation } from "@/types/product";
import { ListsStackParamList } from "@/navigation/ListsStackNavigator";
import { getShoppingLists, removeItemFromList, getListItems } from "@/lib/listsApi";

import kiwiBackground from "../../assets/images/kiwi-background.png";

import logoAH from "../../assets/images/logo-albert-heijn.png";
import logoJumbo from "../../assets/images/logo-jumbo.png";
import logoLidl from "../../assets/images/logo-lidl.png";
import logoAldi from "../../assets/images/logo-aldi.png";
import logoPlus from "../../assets/images/logo-plus.png";
import logoDirk from "../../assets/images/logo-dirk.png";
import logoHoogvliet from "../../assets/images/logo-hoogvliet.png";
import logoDeka from "../../assets/images/logo-deka.png";
import logoCoop from "../../assets/images/logo-coop.png";
import logoSpar from "../../assets/images/logo-spar.png";

const storeLogos: Record<string, any> = {
  "albert-heijn": logoAH,
  "jumbo": logoJumbo,
  "lidl": logoLidl,
  "aldi": logoAldi,
  "plus": logoPlus,
  "dirk": logoDirk,
  "hoogvliet": logoHoogvliet,
  "deka": logoDeka,
  "coop": logoCoop,
  "spar": logoSpar,
};

type ListDetailRouteProp = RouteProp<ListsStackParamList, "ListDetail">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ListItemRow({
  item,
  onRemove,
}: {
  item: ShoppingListItem;
  onRemove: () => void;
}) {
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

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.itemRow,
        animatedStyle,
      ]}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.productName}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemMetaText}>
            {item.quantity}x • {item.lowestPriceStore}
          </Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <Text style={styles.itemPrice}>
          {formatPrice(item.lowestPrice * item.quantity)}
        </Text>
        <Pressable
          onPress={onRemove}
          hitSlop={12}
          style={styles.removeButton}
          testID={`button-remove-item-${item.id}`}
        >
          <Feather name="trash-2" size={16} color="#E63946" />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

function calculateBestStore(items: ShoppingListItem[]): StoreRecommendation[] {
  const storeResults: StoreRecommendation[] = [];
  const totalItems = items.length;

  for (const store of STORES) {
    let totalPrice = 0;
    let itemsAvailable = 0;

    for (const item of items) {
      if (item.allPrices && item.allPrices.length > 0) {
        const storePrice = item.allPrices.find(
          (p) => p.storeId === store.id && p.available
        );
        if (storePrice) {
          totalPrice += storePrice.price * item.quantity;
          itemsAvailable++;
        }
      } else {
        if (item.lowestPriceStore.toLowerCase().includes(store.name.toLowerCase().split(' ')[0])) {
          totalPrice += item.lowestPrice * item.quantity;
          itemsAvailable++;
        }
      }
    }

    if (itemsAvailable > 0) {
      storeResults.push({
        storeName: store.name,
        storeId: store.id,
        totalPrice: Math.round(totalPrice * 100) / 100,
        itemsAvailable,
        totalItems,
        savings: 0,
      });
    }
  }

  // Sort purely by price (cheapest first) - user wants the cheapest store overall
  storeResults.sort((a, b) => a.totalPrice - b.totalPrice);

  if (storeResults.length > 0) {
    // Calculate savings compared to the most expensive store
    const highestPrice = Math.max(...storeResults.map(s => s.totalPrice));
    
    storeResults.forEach(s => {
      s.savings = Math.round((highestPrice - s.totalPrice) * 100) / 100;
    });
  }

  return storeResults;
}

export default function ListDetailScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const route = useRoute<ListDetailRouteProp>();
  const navigation = useNavigation();
  const { listId } = route.params;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [listId])
  );

  const loadList = async () => {
    const lists = await getShoppingLists();
    const found = lists.find((l) => l.id === listId);
    setList(found || null);
  };

  const handleRemoveItem = async (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeItemFromList(listId, itemId);
    loadList();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadList();
    setRefreshing(false);
  }, [listId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const storeRecommendations = useMemo(() => {
    if (!list || list.items.length === 0) return [];
    return calculateBestStore(list.items);
  }, [list]);

  const bestStore = storeRecommendations[0];

  const renderItem = ({ item }: { item: ShoppingListItem }) => (
    <ListItemRow item={item} onRemove={() => handleRemoveItem(item.id)} />
  );

  const renderHeader = () => {
    if (!list) return null;
    return (
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{list.name}</Text>
        <Text style={styles.itemCount}>
          {list.items.length} product{list.items.length !== 1 ? "en" : ""}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyCard}>
        <Feather name="shopping-bag" size={48} color="#666666" />
        <Text style={styles.emptyTitle}>Lijst is leeg</Text>
        <Text style={styles.emptyDescription}>
          Zoek naar producten en voeg ze toe aan deze lijst
        </Text>
      </View>
    </View>
  );

  const renderAIRecommendation = () => {
    if (!list || list.items.length < 2 || !bestStore) return null;

    const hasFullPriceData = list.items.some(item => item.allPrices && item.allPrices.length > 0);
    if (!hasFullPriceData) return null;

    const renderGlassCard = (children: React.ReactNode) => {
      if (Platform.OS === "web") {
        return <View style={styles.aiCardWeb}>{children}</View>;
      }
      return (
        <BlurView intensity={80} tint="light" style={styles.aiCard}>
          {children}
        </BlurView>
      );
    };

    return (
      <View style={styles.aiSection}>
        {renderGlassCard(
          <View style={styles.aiCardContent}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <Feather name="cpu" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.aiHeaderText}>
                <Text style={styles.aiTitle}>AI Winkel Advies</Text>
                <Text style={styles.aiSubtitle}>
                  Gebaseerd op {list.items.length} producten
                </Text>
              </View>
            </View>

            <View style={styles.bestStoreCard}>
              <View style={styles.bestStoreBadge}>
                <Feather name="award" size={14} color="#22C55E" />
                <Text style={styles.bestStoreBadgeText}>Beste keuze</Text>
              </View>
              <View style={styles.bestStoreInfo}>
                <Image
                  source={storeLogos[bestStore.storeId]}
                  style={styles.storeLogo}
                  resizeMode="contain"
                />
                <View style={styles.bestStoreDetails}>
                  <Text style={styles.bestStoreName}>{bestStore.storeName}</Text>
                  <Text style={styles.bestStoreAvailability}>
                    {bestStore.itemsAvailable}/{bestStore.totalItems} producten beschikbaar
                  </Text>
                </View>
                <View style={styles.bestStorePrice}>
                  <Text style={styles.bestStorePriceValue}>
                    {formatPrice(bestStore.totalPrice)}
                  </Text>
                  {bestStore.savings > 0 ? (
                    <Text style={styles.savingsText}>
                      Bespaar {formatPrice(bestStore.savings)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {storeRecommendations.length > 1 ? (
              <View style={styles.otherStores}>
                <Text style={styles.otherStoresTitle}>Andere winkels</Text>
                {storeRecommendations.slice(1, 4).map((store) => (
                  <View key={store.storeId} style={styles.otherStoreRow}>
                    <Image
                      source={storeLogos[store.storeId]}
                      style={styles.otherStoreLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.otherStoreName}>{store.storeName}</Text>
                    <Text style={styles.otherStoreItems}>
                      {store.itemsAvailable}/{store.totalItems}
                    </Text>
                    <Text style={styles.otherStorePrice}>
                      {formatPrice(store.totalPrice)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!list || list.items.length === 0) return null;
    return (
      <>
        {renderAIRecommendation()}
        <View style={styles.footer}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Geschatte totaal (laagste prijzen)</Text>
            <Text style={styles.totalPrice}>{formatPrice(list.totalPrice)}</Text>
          </View>
        </View>
      </>
    );
  };

  if (!list) {
    return (
      <ImageBackground
        source={kiwiBackground}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={[styles.errorContainer, { paddingTop: insets.top + 60 }]}>
          <Text style={styles.errorText}>Lijst niet gevonden</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={kiwiBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <FlatList
        data={list.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 20,
          },
          list.items.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  itemCount: {
    marginTop: Spacing.xs,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFFFFF",
    marginBottom: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    marginBottom: Spacing.xs,
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  itemMeta: {},
  itemMetaText: {
    fontSize: 14,
    color: "#666666",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22C55E",
    marginRight: Spacing.md,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  aiSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  aiCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  aiCardWeb: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  aiCardContent: {
    padding: Spacing.lg,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  aiSubtitle: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
  bestStoreCard: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  bestStoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  bestStoreBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
    marginLeft: Spacing.xs,
  },
  bestStoreInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  bestStoreDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  bestStoreName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  bestStoreAvailability: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
  bestStorePrice: {
    alignItems: "flex-end",
  },
  bestStorePriceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22C55E",
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
    marginTop: 2,
  },
  otherStores: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  otherStoresTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: Spacing.sm,
  },
  otherStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  otherStoreLogo: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  otherStoreName: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    marginLeft: Spacing.sm,
  },
  otherStoreItems: {
    fontSize: 13,
    color: "#666666",
    marginRight: Spacing.md,
  },
  otherStorePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  footer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFFFFF",
    marginTop: Spacing.md,
  },
  totalSection: {
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: Spacing.xs,
  },
  totalPrice: {
    fontSize: 32,
    fontWeight: "700",
    color: "#22C55E",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
});
