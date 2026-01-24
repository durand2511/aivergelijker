import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ImageBackground,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { RecentSearchChip } from "@/components/RecentSearchChip";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ListPickerModal } from "@/components/ListPickerModal";
import { CaptchaModal } from "@/components/CaptchaModal";
import { AdPopup } from "@/components/AdPopup";
import { StoreLogo } from "@/components/StoreLogo";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Product } from "@/types/product";
import { SearchStackParamList } from "@/navigation/SearchStackNavigator";
import { apiRequest } from "@/lib/query-client";
import { getRecentSearches, addRecentSearch } from "@/lib/storage";

import kiwiBackground from "../../assets/images/kiwi-background.png";

type NavigationProp = NativeStackNavigationProp<SearchStackParamList, "Search">;

const STORE_NAMES = ["Albert Heijn", "Jumbo", "Lidl", "Aldi", "Plus", "Dirk", "Hoogvliet", "Deka", "Coop", "Spar"];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listPickerVisible, setListPickerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  const [adVisible, setAdVisible] = useState(false);
  const [pendingAdSearch, setPendingAdSearch] = useState<string | null>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  };

  const performSearch = useCallback(async (searchQuery: string, skipCaptchaCheck = false) => {
    console.log("performSearch called:", { searchQuery, skipCaptchaCheck, isVerified });
    if (!searchQuery.trim()) return;

    if (!isVerified && !skipCaptchaCheck) {
      console.log("Showing captcha modal");
      setPendingSearch(searchQuery);
      setCaptchaVisible(true);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      await addRecentSearch(searchQuery.trim());
      loadRecentSearches();

      const response = await apiRequest("POST", "/api/search", {
        query: searchQuery.trim(),
        sessionId,
      });
      const data = await response.json();
      
      if (data.needsCaptcha) {
        setIsVerified(false);
        setPendingSearch(searchQuery);
        setCaptchaVisible(true);
        return;
      }
      
      setProducts(data.products || []);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Search error:", error);
      if (error?.message?.includes("403") || error?.needsCaptcha) {
        setIsVerified(false);
        setPendingSearch(searchQuery);
        setCaptchaVisible(true);
      } else {
        setProducts([]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isVerified, sessionId]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    console.log("handleSearch called, showing ads for:", query);
    setPendingAdSearch(query);
    setAdVisible(true);
  }, [query]);

  const handleAdComplete = useCallback(() => {
    console.log("All ads completed, starting search for:", pendingAdSearch);
    setAdVisible(false);
    if (pendingAdSearch) {
      performSearch(pendingAdSearch);
      setPendingAdSearch(null);
    }
  }, [pendingAdSearch, performSearch]);

  const handleAdClose = useCallback(() => {
    setAdVisible(false);
    setPendingAdSearch(null);
  }, []);

  const handleCaptchaVerified = useCallback(() => {
    setCaptchaVisible(false);
    setIsVerified(true);
    if (pendingSearch) {
      performSearch(pendingSearch, true);
      setPendingSearch(null);
    }
  }, [pendingSearch, performSearch]);

  const handleCaptchaClose = useCallback(() => {
    setCaptchaVisible(false);
    setPendingSearch(null);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setProducts([]);
    setHasSearched(false);
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleRecentSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setPendingAdSearch(searchQuery);
    setAdVisible(true);
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id, product });
  }, [navigation]);

  const handleAddToList = useCallback((product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProduct(product);
    setListPickerVisible(true);
  }, []);

  const handleCloseListPicker = useCallback(() => {
    setListPickerVisible(false);
    setSelectedProduct(null);
  }, []);

  const onRefresh = useCallback(async () => {
    if (!query.trim()) return;
    
    if (!isVerified) {
      setPendingSearch(query);
      setCaptchaVisible(true);
      return;
    }
    
    setRefreshing(true);
    try {
      const response = await apiRequest("POST", "/api/search", {
        query: query.trim(),
        sessionId,
      });
      const data = await response.json();
      
      if (data.needsCaptcha) {
        setIsVerified(false);
        setPendingSearch(query);
        setCaptchaVisible(true);
        return;
      }
      
      setProducts(data.products || []);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [query, isVerified, sessionId]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      onAddToList={() => handleAddToList(item)}
    />
  ), [handleProductPress, handleAddToList]);

  const GlassCard = useCallback(({ children, style }: { children: React.ReactNode; style?: any }) => {
    if (Platform.OS === "web") {
      return (
        <View style={[styles.glassCardWeb, style]}>
          {children}
        </View>
      );
    }
    return (
      <BlurView intensity={80} tint="light" style={[styles.glassCard, style]}>
        {children}
      </BlurView>
    );
  }, []);

  const renderWelcomeState = useMemo(() => {
    return (
      <ImageBackground
        source={kiwiBackground}
        style={styles.welcomeBackground}
        resizeMode="cover"
      >
        <View style={styles.welcomeOverlay}>
          <View style={[styles.welcomeHeader, { paddingTop: insets.top + Spacing.xl }]}>
            <ThemedText style={styles.welcomeTagline}>
              Kiwi
            </ThemedText>
            <ThemedText style={styles.welcomeTitle}>
              Vind de beste{"\n"}prijs voor je{"\n"}boodschappen
            </ThemedText>
          </View>

          <ScrollView 
            style={styles.welcomeScrollView}
            contentContainerStyle={styles.welcomeBottom}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.searchSection}>
              <ThemedText style={styles.searchSectionLabel}>
                <Feather name="search" size={14} color="#FFFFFF" /> Product zoeken
              </ThemedText>
              <View style={styles.searchWrapper}>
                <SearchBar
                  value={query}
                  onChangeText={handleQueryChange}
                  onSubmit={handleSearch}
                  onClear={handleClear}
                  isLoading={isLoading}
                  placeholder="melk, brood, kaas..."
                />
              </View>
              <ThemedText style={styles.searchHint}>
                Tip: Voeg meerdere producten toe met komma's
              </ThemedText>
            </View>

            {recentSearches.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentChipsWelcome}
                keyboardShouldPersistTaps="handled"
              >
                {recentSearches.slice(0, 5).map((search, index) => (
                  <RecentSearchChip
                    key={index}
                    query={search}
                    onPress={() => handleRecentSearch(search)}
                  />
                ))}
              </ScrollView>
            )}

            {Platform.OS === "web" ? (
              <View style={styles.glassCardWeb}>
                <View style={styles.storeCardContent}>
                  <ThemedText style={styles.storeCardTitle}>
                    Vergelijk bij 10 supermarkten
                  </ThemedText>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storeLogosScroll}
                  >
                    {STORE_NAMES.map((name) => (
                      <View key={name} style={styles.storeLogoItem}>
                        <StoreLogo storeName={name} size={36} />
                        <ThemedText style={styles.storeLogoName}>{name}</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : (
              <BlurView intensity={80} tint="light" style={styles.glassCard}>
                <View style={styles.storeCardContent}>
                  <ThemedText style={styles.storeCardTitle}>
                    Vergelijk bij 10 supermarkten
                  </ThemedText>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storeLogosScroll}
                  >
                    {STORE_NAMES.map((name) => (
                      <View key={name} style={styles.storeLogoItem}>
                        <StoreLogo storeName={name} size={36} />
                        <ThemedText style={styles.storeLogoName}>{name}</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </BlurView>
            )}

                      </ScrollView>
        </View>
      </ImageBackground>
    );
  }, [query, recentSearches, isLoading, tabBarHeight, insets.top, handleQueryChange, handleSearch, handleClear, handleRecentSearch]);

  const renderSearchResults = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.searchingContainer}>
          <View style={styles.searchingCard}>
            <View style={styles.searchingIconContainer}>
              <Feather name="search" size={40} color="#10B981" />
            </View>
            <ThemedText style={styles.searchingTitle}>
              Even geduld...
            </ThemedText>
            <ThemedText style={styles.searchingSubtitle}>
              We doorzoeken 10 supermarkten{"\n"}om de beste prijzen te vinden
            </ThemedText>
            <View style={styles.searchingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
            <View style={styles.searchingStores}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.searchingStoresScroll}
              >
                {STORE_NAMES.map((name) => (
                  <View key={name} style={styles.searchingStoreItem}>
                    <StoreLogo storeName={name} size={28} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      );
    }

    if (products.length === 0 && hasSearched) {
      return (
        <View style={styles.noResultsContainer}>
          <View style={[styles.noResultsIcon, { backgroundColor: theme.textSecondary + "20" }]}>
            <Feather name="search" size={32} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.noResultsTitle}>
            Geen resultaten
          </ThemedText>
          <ThemedText style={[styles.noResultsDescription, { color: theme.textSecondary }]}>
            Probeer een andere zoekopdracht of controleer de spelling
          </ThemedText>
        </View>
      );
    }

    return null;
  }, [isLoading, products.length, hasSearched, theme]);

  if (!hasSearched) {
    return (
      <View style={styles.container}>
        {renderWelcomeState}
        <ListPickerModal
          visible={listPickerVisible}
          onClose={handleCloseListPicker}
          product={selectedProduct}
        />
        <CaptchaModal
          visible={captchaVisible}
          onVerified={handleCaptchaVerified}
          onClose={handleCaptchaClose}
          sessionId={sessionId}
        />
        <AdPopup
          visible={adVisible}
          onComplete={handleAdComplete}
          onClose={handleAdClose}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={kiwiBackground}
        style={styles.welcomeBackground}
        resizeMode="cover"
      >
        <View style={styles.resultsOverlay}>
          <View
            style={[
              styles.fixedHeader,
              { paddingTop: insets.top + Spacing.md },
            ]}
          >
            <View style={styles.headerRow}>
              <ThemedText type="h2" style={styles.resultsTitleWhite}>
                Resultaten
              </ThemedText>
              <View style={styles.clearButtonWhite}>
                <Feather
                  name="x"
                  size={20}
                  color="#FFFFFF"
                  onPress={handleClear}
                />
              </View>
            </View>
            <View style={styles.searchContainer}>
              <SearchBar
                value={query}
                onChangeText={handleQueryChange}
                onSubmit={handleSearch}
                onClear={handleClear}
                isLoading={isLoading}
                placeholder="Zoek producten..."
              />
            </View>
          </View>

          {renderSearchResults}
          
          {products.length > 0 && (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: tabBarHeight + Spacing.xl + Spacing.lg },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FFFFFF"
                />
              }
            />
          )}
        </View>
      </ImageBackground>

      <ListPickerModal
        visible={listPickerVisible}
        onClose={handleCloseListPicker}
        product={selectedProduct}
      />

      <CaptchaModal
        visible={captchaVisible}
        onVerified={handleCaptchaVerified}
        onClose={handleCaptchaClose}
        sessionId={sessionId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  welcomeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
  },
  welcomeHeader: {
    paddingHorizontal: Spacing.xl,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 44,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeBottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
    gap: Spacing.lg,
  },
  searchWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.xs,
  },
  recentChipsWelcome: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  glassCardWeb: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  storeCardContent: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  storeCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: Spacing.md,
  },
  storeLogosRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
  },
  storeLogosScroll: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  storeLogoItem: {
    alignItems: "center",
    minWidth: 60,
  },
  storeLogoName: {
    fontSize: 10,
    color: "#666666",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fixedHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultsTitle: {
    fontWeight: "bold",
  },
  resultsTitleWhite: {
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  clearButtonWhite: {
    padding: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: BorderRadius.full,
  },
  resultsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
  },
  noResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  noResultsTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  noResultsDescription: {
    textAlign: "center",
  },
  welcomeScrollView: {
    flex: 1,
  },
  searchSection: {
    marginBottom: Spacing.sm,
  },
  searchSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: Spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  recipeResultsScroll: {
    flex: 1,
  },
  recipeResultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  recipeSummaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  recipeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  recipeServings: {
    fontSize: 14,
    color: "#666666",
  },
  cheapestStoreCard: {
    backgroundColor: "#10B981",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cheapestLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  cheapestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cheapestInfo: {
    flex: 1,
  },
  cheapestStoreName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cheapestPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: Spacing.xs,
  },
  addAllToListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  addAllToListText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  storeTotalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  storeTotalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    width: "31%",
    minWidth: 90,
  },
  storeTotalCardCheapest: {
    backgroundColor: "#D1FAE5",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  storeTotalName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666666",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  storeTotalPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: Spacing.xs,
  },
  storeTotalPriceCheapest: {
    color: "#059669",
  },
  cheapestBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  cheapestBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  ingredientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  ingredientPrices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  ingredientPriceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  ingredientPriceText: {
    fontSize: 13,
    color: "#666666",
  },
  ingredientPriceLowest: {
    color: "#10B981",
    fontWeight: "bold",
  },
  searchingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  searchingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  searchingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  searchingSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  searchingDots: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  searchingStores: {
    width: "100%",
  },
  searchingStoresScroll: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
    justifyContent: "center",
  },
  searchingStoreItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
});
