import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ShoppingList, Product } from "@/types/product";
import { getShoppingLists, createShoppingList, addItemToList } from "@/lib/storage";

interface ListPickerModalProps {
  visible: boolean;
  onClose: () => void;
  product?: Product | null;
  products?: Product[];
  onSuccess?: () => void;
}

export function ListPickerModal({
  visible,
  onClose,
  product,
  products,
  onSuccess,
}: ListPickerModalProps) {
  const { theme } = useTheme();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadLists();
      setShowNewList(false);
      setNewListName("");
    }
  }, [visible]);

  const loadLists = async () => {
    const data = await getShoppingLists();
    setLists(data);
    if (data.length === 0) {
      setShowNewList(true);
    }
  };

  const itemsToAdd = products && products.length > 0 ? products : (product ? [product] : []);

  const handleSelectList = async (list: ShoppingList) => {
    if (itemsToAdd.length === 0) return;
    setIsLoading(true);
    
    try {
      for (const item of itemsToAdd) {
        await addItemToList(list.id, {
          productId: item.id,
          productName: item.name,
          quantity: 1,
          lowestPrice: item.lowestPrice,
          lowestPriceStore: item.lowestPriceStore,
          allPrices: item.prices,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error adding to list:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim() || itemsToAdd.length === 0) return;
    setIsLoading(true);

    try {
      const newList = await createShoppingList(newListName.trim());
      for (const item of itemsToAdd) {
        await addItemToList(newList.id, {
          productId: item.id,
          productName: item.name,
          quantity: 1,
          lowestPrice: item.lowestPrice,
          lowestPriceStore: item.lowestPriceStore,
          allPrices: item.prices,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating list:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <Pressable
      onPress={() => handleSelectList(item)}
      style={[
        styles.listItem,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
      disabled={isLoading}
    >
      <View style={styles.listInfo}>
        <ThemedText type="body" style={styles.listName}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.items.length} product{item.items.length !== 1 ? "en" : ""}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        >
          <View style={styles.header}>
            <ThemedText type="h3">Toevoegen aan lijst</ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {itemsToAdd.length > 0 ? (
            <View
              style={[
                styles.productPreview,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              {itemsToAdd.length === 1 ? (
                <>
                  <ThemedText type="body" numberOfLines={1}>
                    {itemsToAdd[0].name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.success }}>
                    €{itemsToAdd[0].lowestPrice.toFixed(2)} bij {itemsToAdd[0].lowestPriceStore}
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText type="body" numberOfLines={1}>
                    {itemsToAdd.length} ingrediënten
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.success }}>
                    Totaal: €{itemsToAdd.reduce((sum, p) => sum + p.lowestPrice, 0).toFixed(2)}
                  </ThemedText>
                </>
              )}
            </View>
          ) : null}

          {showNewList || lists.length === 0 ? (
            <View style={styles.newListForm}>
              <ThemedText type="body" style={styles.formLabel}>
                {lists.length === 0
                  ? "Maak je eerste lijst"
                  : "Nieuwe lijst maken"}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Naam van de lijst"
                placeholderTextColor={theme.textSecondary}
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
              />
              <View style={styles.formButtons}>
                {lists.length > 0 ? (
                  <Pressable
                    onPress={() => setShowNewList(false)}
                    style={[
                      styles.cancelButton,
                      { borderColor: theme.border },
                    ]}
                  >
                    <ThemedText>Annuleren</ThemedText>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={handleCreateAndAdd}
                  style={[
                    styles.createButton,
                    { backgroundColor: theme.primary },
                    (!newListName.trim() || isLoading) && styles.buttonDisabled,
                  ]}
                  disabled={!newListName.trim() || isLoading}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {isLoading ? "Bezig..." : "Maken & toevoegen"}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <FlatList
                data={lists}
                renderItem={renderListItem}
                keyExtractor={(item) => item.id}
                style={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
              <Pressable
                onPress={() => setShowNewList(true)}
                style={[
                  styles.newListButton,
                  { borderColor: theme.primary },
                ]}
              >
                <Feather name="plus" size={18} color={theme.primary} />
                <ThemedText style={{ color: theme.primary, marginLeft: Spacing.sm }}>
                  Nieuwe lijst maken
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  productPreview: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  listContainer: {
    maxHeight: 300,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    marginBottom: Spacing.xs,
  },
  newListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
  },
  newListForm: {
    paddingTop: Spacing.sm,
  },
  formLabel: {
    marginBottom: Spacing.md,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  formButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
