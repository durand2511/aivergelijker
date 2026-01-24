import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Pressable, RefreshControl, ImageBackground, Platform, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ShoppingListCard } from "@/components/ShoppingListCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ShoppingList } from "@/types/product";
import { ListsStackParamList } from "@/navigation/ListsStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getShoppingLists, deleteShoppingList } from "@/lib/listsApi";

import kiwiBackground from "../../assets/images/kiwi-background.png";

type ListsNavigationProp = NativeStackNavigationProp<ListsStackParamList, "Lists">;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ListsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<ListsNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const loadLists = async () => {
    const data = await getShoppingLists();
    setLists(data);
  };

  const handleCreateList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rootNavigation.navigate("CreateList");
  };

  const handleListPress = (list: ShoppingList) => {
    navigation.navigate("ListDetail", { listId: list.id });
  };

  const handleDeleteList = async (listId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteShoppingList(listId);
    loadLists();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLists();
    setRefreshing(false);
  }, []);

  const renderList = ({ item }: { item: ShoppingList }) => (
    <ShoppingListCard
      list={item}
      onPress={() => handleListPress(item)}
      onDelete={() => handleDeleteList(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={Platform.OS === "web" ? styles.glassCardWeb : styles.glassCard}>
        {Platform.OS === "web" ? (
          <View style={styles.emptyCardContent}>
            <View style={styles.emptyIconContainer}>
              <Feather name="clipboard" size={32} color="#1A1A1A" />
            </View>
            <Text style={styles.emptyTitle}>Geen lijsten</Text>
            <Text style={styles.emptyDescription}>
              Maak je eerste boodschappenlijst en vergelijk prijzen
            </Text>
            <Pressable
              onPress={handleCreateList}
              style={styles.createButton}
              testID="button-create-first-list"
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Nieuwe Lijst</Text>
            </Pressable>
          </View>
        ) : (
          <BlurView intensity={80} tint="light" style={styles.blurContent}>
            <View style={styles.emptyCardContent}>
              <View style={styles.emptyIconContainer}>
                <Feather name="clipboard" size={32} color="#1A1A1A" />
              </View>
              <Text style={styles.emptyTitle}>Geen lijsten</Text>
              <Text style={styles.emptyDescription}>
                Maak je eerste boodschappenlijst en vergelijk prijzen
              </Text>
              <Pressable
                onPress={handleCreateList}
                style={styles.createButton}
                testID="button-create-first-list"
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Nieuwe Lijst</Text>
              </Pressable>
            </View>
          </BlurView>
        )}
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={kiwiBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <FlatList
        data={lists}
        renderItem={renderList}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + 40,
          },
          lists.length === 0 && styles.emptyContent,
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

      {lists.length > 0 ? (
        <Pressable
          onPress={handleCreateList}
          style={[
            styles.fab,
            {
              backgroundColor: theme.primary,
              bottom: tabBarHeight + 40,
            },
          ]}
          testID="button-create-list"
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
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
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
  },
  glassCardWeb: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    width: "100%",
  },
  blurContent: {
    width: "100%",
  },
  emptyCardContent: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
