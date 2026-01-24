import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Platform,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Spacing, BorderRadius } from "@/constants/theme";
import { Gender } from "@/types/user";
import { saveAuthState } from "@/lib/userStorage";
import { getApiUrl } from "@/lib/query-client";

import kiwiBackground from "../../assets/images/kiwi-background.png";

interface LoginScreenProps {
  onLoginComplete: () => void;
}

type AuthMode = "login" | "register";

export default function LoginScreen({ onLoginComplete }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoginValid = email.trim().length > 0 && password.length >= 6;
  const isRegisterValid = isLoginValid && name.trim().length > 0 && gender !== null;

  const handleLogin = async () => {
    if (!isLoginValid) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError("");

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Inloggen mislukt");
        return;
      }

      await saveAuthState(data.token, data.user);
      onLoginComplete();
    } catch (err) {
      console.error("Login error:", err);
      setError("Verbinding mislukt. Probeer opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isRegisterValid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError("");

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registratie mislukt");
        return;
      }

      await saveAuthState(data.token, data.user);
      onLoginComplete();
    } catch (err) {
      console.error("Register error:", err);
      setError("Verbinding mislukt. Probeer opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  const renderGlassCard = (children: React.ReactNode) => {
    if (Platform.OS === "web") {
      return <View style={styles.glassCardWeb}>{children}</View>;
    }
    return (
      <BlurView intensity={80} tint="light" style={styles.glassCard}>
        {children}
      </BlurView>
    );
  };

  const GenderButton = ({ value, label }: { value: Gender; label: string }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGender(value);
      }}
      style={[
        styles.genderButton,
        gender === value && styles.genderButtonSelected,
      ]}
    >
      <Text
        style={[
          styles.genderButtonText,
          gender === value && styles.genderButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ImageBackground
      source={kiwiBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brandName}>Kiwi</Text>
            <Text style={styles.tagline}>
              {mode === "login" ? "Welkom terug!" : "Maak een account aan"}
            </Text>
          </View>

          {renderGlassCard(
            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mailadres</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jouw@email.nl"
                  placeholderTextColor="#999999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Wachtwoord (minimaal 6 tekens)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Minimaal 6 tekens"
                    placeholderTextColor="#999999"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666666"
                    />
                  </Pressable>
                </View>
              </View>

              {mode === "register" ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Naam</Text>
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="Jouw naam"
                      placeholderTextColor="#999999"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Geslacht</Text>
                    <View style={styles.genderRow}>
                      <GenderButton value="man" label="Man" />
                      <GenderButton value="vrouw" label="Vrouw" />
                    </View>
                  </View>
                </>
              ) : null}

              {error.length > 0 ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>
          )}

          <Pressable
            onPress={mode === "login" ? handleLogin : handleRegister}
            disabled={isLoading || (mode === "login" ? !isLoginValid : !isRegisterValid)}
            style={[
              styles.submitButton,
              (isLoading || (mode === "login" ? !isLoginValid : !isRegisterValid)) &&
                styles.submitButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === "login" ? "Inloggen" : "Registreren"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={switchMode} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {mode === "login"
                ? "Nog geen account? Registreer hier"
                : "Al een account? Log hier in"}
            </Text>
          </Pressable>

          <Text style={styles.privacyNote}>
            Je gegevens worden veilig opgeslagen en gesynchroniseerd
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  brandName: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: Spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  formContent: {
    padding: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: "#1A1A1A",
  },
  eyeButton: {
    padding: Spacing.md,
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  genderButtonSelected: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  genderButtonTextSelected: {
    color: "#FFFFFF",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(26, 26, 26, 0.5)",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  switchButton: {
    marginTop: Spacing.lg,
    alignItems: "center",
    padding: Spacing.sm,
  },
  switchText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textDecorationLine: "underline",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  privacyNote: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: Spacing.lg,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
