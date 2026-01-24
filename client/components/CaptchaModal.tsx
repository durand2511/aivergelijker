import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";

interface Challenge {
  num1: number;
  num2: number;
  question: string;
}

interface CaptchaModalProps {
  visible: boolean;
  onVerified: () => void;
  onClose: () => void;
  sessionId: string;
}

export function CaptchaModal({
  visible,
  onVerified,
  onClose,
  sessionId,
}: CaptchaModalProps) {
  const insets = useSafeAreaInsets();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadChallenge();
    } else {
      setAnswer("");
      setError(null);
    }
  }, [visible]);

  const loadChallenge = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAnswer("");
      const url = new URL(`/api/challenge/get?sessionId=${encodeURIComponent(sessionId)}`, getApiUrl()).toString();
      const response = await fetch(url);
      const data = await response.json();
      if (data.question) {
        setChallenge(data);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Kon vraag niet laden");
      }
    } catch (err) {
      setError("Er is iets misgegaan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError("Vul een antwoord in");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/challenge/verify", {
        answer: answer.trim(),
        sessionId,
      });
      
      const result = await response.json();
      
      if (result.verified) {
        onVerified();
      } else {
        if (result.newChallenge) {
          setChallenge(result.newChallenge);
          setAnswer("");
          setError(null);
        } else {
          await loadChallenge();
        }
      }
    } catch (err) {
      await loadChallenge();
    } finally {
      setIsLoading(false);
    }
  };

  const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => {
    if (Platform.OS === "web") {
      return (
        <View style={[styles.cardWeb, style]}>
          {children}
        </View>
      );
    }
    return (
      <BlurView intensity={80} tint="light" style={[styles.cardNative, style]}>
        {children}
      </BlurView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <GlassCard style={[styles.card, { marginTop: insets.top + 40 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Even controleren</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={24} color="#666666" />
            </Pressable>
          </View>

          <Text style={styles.description}>
            Los deze simpele som op om door te gaan
          </Text>

          {isLoading && !challenge ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#004E89" />
              <Text style={styles.loadingText}>Laden...</Text>
            </View>
          ) : null}

          {challenge ? (
            <View style={styles.challengeContainer}>
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{challenge.question}</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Jouw antwoord"
                placeholderTextColor="#999999"
                value={answer}
                onChangeText={setAnswer}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                autoFocus
                editable={!isLoading}
              />

              {error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color="#E63946" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Controleren</Text>
                )}
              </Pressable>

              <Pressable onPress={loadChallenge} style={styles.newQuestionButton}>
                <Feather name="refresh-cw" size={14} color="#004E89" />
                <Text style={styles.newQuestionText}>Nieuwe vraag</Text>
              </Pressable>
            </View>
          ) : null}
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
  },
  cardNative: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    padding: Spacing.xl,
  },
  cardWeb: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    padding: Spacing.xl,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  description: {
    fontSize: 14,
    color: "#666666",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  loadingContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: "#666666",
  },
  challengeContainer: {
    gap: Spacing.md,
  },
  questionBox: {
    backgroundColor: "#F0F7FF",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#004E89",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "600",
    color: "#1A1A1A",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#E63946",
  },
  submitButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  newQuestionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  newQuestionText: {
    color: "#004E89",
    fontSize: 14,
    fontWeight: "500",
  },
});
