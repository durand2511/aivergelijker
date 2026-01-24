import React from "react";
import { View, StyleSheet, ScrollView, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { Spacing, BorderRadius } from "@/constants/theme";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Voorwaarden</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Algemene Voorwaarden</Text>
        <Text style={styles.subtitle}>Uitgebreide Algemene Voorwaarden – AI Boodschappenvergelijker</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Definities</Text>
          <Text style={styles.sectionText}>
            Uitleg van begrippen zoals 'Dienst', 'Gebruiker' en 'App'.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Toepasselijkheid</Text>
          <Text style={styles.sectionText}>
            Deze voorwaarden zijn van toepassing op elk gebruik van de app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Registratie en accounts</Text>
          <Text style={styles.sectionText}>
            Gebruikers zijn verantwoordelijk voor hun accountbeveiliging.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Gebruik van de dienst</Text>
          <Text style={styles.sectionText}>
            Misbruik, scraping of commercieel hergebruik is verboden.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Prijsinformatie en disclaimers</Text>
          <Text style={styles.sectionText}>
            Prijzen zijn indicatief en kunnen afwijken van winkelprijzen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. AI-functionaliteit</Text>
          <Text style={styles.sectionText}>
            AI-adviezen zijn informatief en vormen geen bindend advies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Betalingen en premium diensten</Text>
          <Text style={styles.sectionText}>
            Indien van toepassing gelden aparte betalingsvoorwaarden.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectueel eigendom</Text>
          <Text style={styles.sectionText}>
            Alle software, data en AI-modellen blijven eigendom van de aanbieder.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Aansprakelijkheidsbeperking</Text>
          <Text style={styles.sectionText}>
            Wij zijn niet aansprakelijk voor schade door gebruik van de app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Beëindiging</Text>
          <Text style={styles.sectionText}>
            Wij mogen accounts beëindigen bij overtreding.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Wijzigingen van de dienst</Text>
          <Text style={styles.sectionText}>
            Wij mogen functies aanpassen of beëindigen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Overmacht</Text>
          <Text style={styles.sectionText}>
            Wij zijn niet aansprakelijk bij overmacht.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Toepasselijk recht en geschillen</Text>
          <Text style={styles.sectionText}>
            Nederlands recht is van toepassing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact</Text>
          <Text style={styles.sectionText}>
            Voor vragen kun je contact opnemen via de supportpagina.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: Spacing.sm,
  },
  sectionText: {
    fontSize: 14,
    color: "#444444",
    lineHeight: 22,
  },
});
