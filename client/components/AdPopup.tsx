import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ADS = [
  {
    id: 1,
    title: "Albert Heijn",
    subtitle: "Nu 25% korting op alle huismerkproducten!",
    description: "Alleen deze week geldig. Bekijk de folder.",
    backgroundColor: "#00A0E2",
    secondaryColor: "#0077B3",
    icon: "tag" as const,
    sponsor: "Gesponsord",
  },
  {
    id: 2,
    title: "Jumbo Extra's",
    subtitle: "Spaar voor gratis boodschappen",
    description: "Meld je nu aan en ontvang 500 bonus punten.",
    backgroundColor: "#FFD100",
    secondaryColor: "#E6BC00",
    icon: "gift" as const,
    sponsor: "Gesponsord",
  },
  {
    id: 3,
    title: "Lidl Plus",
    subtitle: "Download de app voor exclusieve kortingen",
    description: "Elke week nieuwe aanbiedingen speciaal voor jou.",
    backgroundColor: "#0050AA",
    secondaryColor: "#003D80",
    icon: "smartphone" as const,
    sponsor: "Gesponsord",
  },
];

const SKIP_DELAY = 5;

interface AdPopupProps {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export function AdPopup({ visible, onComplete, onClose }: AdPopupProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log("AdPopup visible, resetting state");
      setCurrentAdIndex(0);
      setCountdown(SKIP_DELAY);
      setCanSkip(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    console.log("Starting countdown for ad", currentAdIndex + 1);
    setCountdown(SKIP_DELAY);
    setCanSkip(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, currentAdIndex]);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;

    console.log("Skipping ad", currentAdIndex + 1);
    if (currentAdIndex < ADS.length - 1) {
      setCurrentAdIndex((prev) => prev + 1);
    } else {
      console.log("All ads completed");
      onComplete();
    }
  }, [canSkip, currentAdIndex, onComplete]);

  const handleClose = useCallback(() => {
    console.log("Ad popup closed");
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const currentAd = ADS[currentAdIndex];
  const progressWidth = ((currentAdIndex + 1) / ADS.length) * 100;

  const AdContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
        </View>
        <View style={styles.headerRow}>
          <View style={styles.sponsorBadge}>
            <ThemedText style={styles.sponsorText}>{currentAd.sponsor}</ThemedText>
          </View>
          <ThemedText style={styles.adCounter}>
            {currentAdIndex + 1} / {ADS.length}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.adCard, { backgroundColor: currentAd.backgroundColor }]}>
        <View style={[styles.iconCircle, { backgroundColor: currentAd.secondaryColor }]}>
          <Feather name={currentAd.icon} size={48} color="#FFFFFF" />
        </View>
        
        <ThemedText style={styles.adTitle}>{currentAd.title}</ThemedText>
        <ThemedText style={styles.adSubtitle}>{currentAd.subtitle}</ThemedText>
        <ThemedText style={styles.adDescription}>{currentAd.description}</ThemedText>

        <View style={styles.ctaButton}>
          <ThemedText style={styles.ctaText}>Meer informatie</ThemedText>
        </View>
      </View>

      <Pressable
        style={[
          styles.skipButton,
          canSkip ? styles.skipButtonActive : styles.skipButtonDisabled,
        ]}
        onPress={handleSkip}
        disabled={!canSkip}
      >
        {canSkip ? (
          <View style={styles.skipButtonContent}>
            <ThemedText style={styles.skipButtonTextActive}>
              {currentAdIndex < ADS.length - 1 ? "Volgende advertentie" : "Ga naar zoeken"}
            </ThemedText>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.skipButtonContent}>
            <Feather name="clock" size={18} color="rgba(255,255,255,0.6)" />
            <ThemedText style={styles.skipButtonTextDisabled}>
              Overslaan in {countdown} seconden
            </ThemedText>
          </View>
        )}
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={handleClose}>
        <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
        <ThemedText style={styles.cancelButtonText}>Annuleer zoekopdracht</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === "web" ? (
          <View style={styles.containerWeb}>
            <AdContent />
          </View>
        ) : (
          <BlurView intensity={95} tint="dark" style={styles.container}>
            <AdContent />
          </BlurView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  containerWeb: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: "rgba(20, 20, 20, 0.98)",
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  progressContainer: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  sponsorBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  sponsorText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  adCounter: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  adCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  adTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  adSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  adDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  skipButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  skipButtonActive: {
    backgroundColor: "#10B981",
  },
  skipButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  skipButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  skipButtonTextActive: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  skipButtonTextDisabled: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  cancelButtonText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
  },
});
