import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Switch, ScrollView, ImageBackground, Platform, Text, Modal, Linking, Image, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";

import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { STORES } from "@/types/product";
import { StoreLogo } from "@/components/StoreLogo";
import { UserProfile } from "@/types/user";
import { getUserProfile, updateUserProfile, clearUserProfile } from "@/lib/userStorage";

import kiwiBackground from "../../assets/images/kiwi-background.png";

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  showArrow?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsRow({
  icon,
  label,
  value,
  showArrow = true,
  onPress,
  rightElement,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.settingsRow}
    >
      <View style={styles.settingsLeft}>
        <View style={styles.iconContainer}>
          <Feather name={icon as any} size={18} color="#1A1A1A" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.settingsRight}>
        {value ? (
          <Text style={styles.rowValue}>{value}</Text>
        ) : null}
        {rightElement}
        {showArrow && !rightElement ? (
          <Feather name="chevron-right" size={20} color="#666666" />
        ) : null}
      </View>
    </Pressable>
  );
}

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const rootNavigation = useNavigation<RootNavigationProp>();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>(
    STORES.map((s) => s.id)
  );
  const [showAboutModal, setShowAboutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    const profile = await getUserProfile();
    setUserProfile(profile);
  };

  const handleOpenAbout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAboutModal(true);
  };

  const handleOpenPrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rootNavigation.navigate("Privacy");
  };

  const handleOpenTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rootNavigation.navigate("Terms");
  };

  const handleContact = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const email = "durand2511@gmail.com";
    const subject = "Kiwi - Contact";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    await Linking.openURL(url);
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearUserProfile();
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      const { reloadAppAsync } = await import('expo');
      await reloadAppAsync();
    }
  };

  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  };

  const toggleStore = (storeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedStores.includes(storeId)) {
      if (selectedStores.length > 1) {
        setSelectedStores(selectedStores.filter((id) => id !== storeId));
      }
    } else {
      setSelectedStores([...selectedStores, storeId]);
    }
  };

  const handleChangeProfilePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        "Geen toegang",
        "Je moet toegang geven tot je foto's om een profielfoto te kiezen."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      const updated = await updateUserProfile({ profileImage: imageUri });
      if (updated) {
        setUserProfile(updated);
      }
    }
  };

  const getGenderLabel = (gender: string): string => {
    switch (gender) {
      case "man": return "Man";
      case "vrouw": return "Vrouw";
      default: return gender;
    }
  };

  const renderGlassCard = (children: React.ReactNode) => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.glassCardWeb}>
          {children}
        </View>
      );
    }
    return (
      <View style={styles.glassCard}>
        <BlurView intensity={80} tint="light" style={styles.blurContent}>
          {children}
        </BlurView>
      </View>
    );
  };

  return (
    <ImageBackground
      source={kiwiBackground}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: tabBarHeight + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <Pressable onPress={handleChangeProfilePhoto} style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {userProfile?.profileImage ? (
                <Image
                  source={{ uri: userProfile.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <Feather name="user" size={40} color="#1A1A1A" />
              )}
            </View>
            <View style={styles.editBadge}>
              <Feather name="camera" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.userName}>{userProfile?.name || "Gebruiker"}</Text>
          <Text style={styles.userSubtitle}>
            {userProfile?.email || "Slim boodschappen doen"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VOORKEUREN</Text>
          {renderGlassCard(
            <SettingsRow
              icon="bell"
              label="Meldingen"
              showArrow={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ true: "#1A1A1A", false: "#E0E0E0" }}
                />
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WINKELS</Text>
          {renderGlassCard(
            <>
              {STORES.map((store) => (
                <Pressable
                  key={store.id}
                  onPress={() => toggleStore(store.id)}
                  style={styles.storeRow}
                >
                  <View style={styles.storeRowLeft}>
                    <StoreLogo storeName={store.name} size={32} />
                    <Text style={styles.storeRowLabel}>{store.name}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: selectedStores.includes(store.id)
                          ? "#1A1A1A"
                          : "transparent",
                        borderColor: selectedStores.includes(store.id)
                          ? "#1A1A1A"
                          : "#CCCCCC",
                      },
                    ]}
                  >
                    {selectedStores.includes(store.id) ? (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          {renderGlassCard(
            <>
              <SettingsRow icon="info" label="Over" value="v1.0.0" onPress={handleOpenAbout} />
              <SettingsRow icon="shield" label="Privacybeleid" onPress={handleOpenPrivacy} />
              <SettingsRow icon="file-text" label="Voorwaarden" onPress={handleOpenTerms} />
              <SettingsRow icon="mail" label="Contact" onPress={handleContact} />
              <SettingsRow icon="log-out" label="Uitloggen" showArrow={false} onPress={handleLogout} />
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Kiwi</Text>
          <Text style={styles.footerSubtext}>Boodschappen Vergelijker</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAboutModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Feather name="shopping-bag" size={32} color="#1A1A1A" />
              </View>
              <Text style={styles.modalTitle}>Kiwi</Text>
              <Text style={styles.modalSubtitle}>Boodschappen Vergelijker</Text>
              <Text style={styles.modalVersion}>Versie 1.0.0</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Vergelijk prijzen van boodschappen bij alle grote Nederlandse supermarkten en bespaar geld op je wekelijkse boodschappen.
              </Text>
              
              <View style={styles.modalFeatures}>
                <View style={styles.modalFeatureRow}>
                  <Feather name="search" size={16} color="#1A1A1A" />
                  <Text style={styles.modalFeatureText}>AI-gestuurde productzoekopdrachten</Text>
                </View>
                <View style={styles.modalFeatureRow}>
                  <Feather name="bar-chart-2" size={16} color="#1A1A1A" />
                  <Text style={styles.modalFeatureText}>Prijsvergelijking bij 10 supermarkten</Text>
                </View>
                <View style={styles.modalFeatureRow}>
                  <Feather name="list" size={16} color="#1A1A1A" />
                  <Text style={styles.modalFeatureText}>Boodschappenlijsten beheren</Text>
                </View>
              </View>
            </View>
            
            <Pressable
              style={styles.modalButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.modalButtonText}>Sluiten</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: Spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    letterSpacing: 0.5,
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
  blurContent: {
    width: "100%",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rowLabel: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  rowValue: {
    fontSize: 14,
    color: "#666666",
    marginRight: Spacing.sm,
  },
  settingsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  storeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  storeRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  storeRowLabel: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footerSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    width: "100%",
    maxWidth: 340,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: Spacing.xs,
  },
  modalVersion: {
    fontSize: 14,
    color: "#666666",
  },
  modalBody: {
    marginBottom: Spacing.xl,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  modalFeatures: {
    gap: Spacing.sm,
  },
  modalFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modalFeatureText: {
    fontSize: 14,
    color: "#1A1A1A",
  },
  modalButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
