import React, { useRef } from "react";
import { View, TextInput, StyleSheet, Pressable, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = "Zoek producten...",
  isLoading = false,
  autoFocus = false,
}: SearchBarProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const inputRef = useRef<TextInput>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFocus = () => {
    scale.value = withSpring(1.02, { damping: 15, stiffness: 150 });
  };

  const handleBlur = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handleClear = () => {
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: "#FFFFFF", borderColor: "transparent" },
        animatedStyle,
      ]}
    >
      <View style={styles.iconContainer}>
        {isLoading ? (
          <Feather name="loader" size={20} color={theme.primary} />
        ) : (
          <Feather name="search" size={20} color="#666666" />
        )}
      </View>
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: "#1A1A1A" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        testID="search-input"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={8}
          testID="button-clear-search"
        >
          <Feather name="x" size={18} color="#666666" />
        </Pressable>
      ) : null}
      <View style={[styles.aiIndicator, { backgroundColor: theme.primary }]}>
        <Feather name="cpu" size={14} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: Spacing.lg,
    overflow: "visible",
  },
  iconContainer: {
    marginRight: Spacing.md,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  aiIndicator: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
