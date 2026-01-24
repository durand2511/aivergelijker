import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ImageBackground, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Spacing, BorderRadius } from "@/constants/theme";
import { createShoppingList } from "@/lib/listsApi";

import kiwiBackground from "../../assets/images/kiwi-background.png";

export default function CreateListModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createShoppingList(name.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating list:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  };

  const suggestions = [
    "Weekboodschappen",
    "Feestje",
    "Gezond eten",
    "Budget week",
  ];

  const handleSuggestion = (suggestion: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName(suggestion);
  };

  return (
    <ImageBackground
      source={kiwiBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Nieuwe Lijst</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.label}>Naam van de lijst</Text>
          <View style={styles.inputContainer}>
            <Feather name="edit-3" size={20} color="#666666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Bijv. Weekboodschappen"
              placeholderTextColor="#888888"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              testID="input-list-name"
            />
            {name.length > 0 ? (
              <Pressable onPress={() => setName("")} hitSlop={8}>
                <Feather name="x" size={18} color="#666666" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Suggesties</Text>
            <View style={styles.suggestionsRow}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  style={styles.suggestionChip}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!name.trim() || isCreating}
            style={[
              styles.createButton,
              (!name.trim() || isCreating) && styles.createButtonDisabled,
            ]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Lijst aanmaken</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    color: "#1A1A1A",
  },
  suggestions: {
    marginTop: Spacing.xl,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    marginBottom: Spacing.sm,
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: 14,
    color: "#1A1A1A",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: "#1A1A1A",
    marginTop: Spacing.xl,
  },
  createButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
});
