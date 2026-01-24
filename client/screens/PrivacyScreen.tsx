import React from "react";
import { View, StyleSheet, ScrollView, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { Spacing, BorderRadius } from "@/constants/theme";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacyverklaring</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Privacyverklaring</Text>
        <Text style={styles.subtitle}>Uitgebreide Privacyverklaring – AI Boodschappenvergelijker</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Inleiding</Text>
          <Text style={styles.sectionText}>
            Deze privacyverklaring legt uit hoe wij persoonsgegevens verwerken wanneer je onze AI Boodschappenvergelijker gebruikt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Wie zijn wij?</Text>
          <Text style={styles.sectionText}>
            Wij zijn de aanbieder van de AI Boodschappenvergelijker app. Voor vragen kun je contact opnemen via de supportpagina.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Welke gegevens verzamelen wij?</Text>
          <Text style={styles.sectionText}>
            • Accountgegevens (indien van toepassing){"\n"}
            • Zoekopdrachten, boodschappenlijsten en voorkeuren{"\n"}
            • Locatiegegevens (indien toegestaan){"\n"}
            • App-gebruik en interacties{"\n"}
            • Technische data (apparaat, IP, foutmeldingen)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Rechtsgrond voor verwerking</Text>
          <Text style={styles.sectionText}>
            Wij verwerken data op basis van toestemming, uitvoering van de overeenkomst en gerechtvaardigd belang.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Doeleinden</Text>
          <Text style={styles.sectionText}>
            • Prijsvergelijking en productadvies{"\n"}
            • Personalisatie van gebruikerservaring{"\n"}
            • Verbetering van AI-modellen en nauwkeurigheid{"\n"}
            • Fraudepreventie en beveiliging
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. AI en geautomatiseerde besluitvorming</Text>
          <Text style={styles.sectionText}>
            Onze app gebruikt AI om aanbevelingen te doen. Dit kan automatisch gebeuren, maar heeft geen juridische gevolgen voor gebruikers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Delen met derden</Text>
          <Text style={styles.sectionText}>
            Wij delen gegevens alleen met partners indien noodzakelijk, en nooit zonder passende bescherming.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Internationale doorgifte</Text>
          <Text style={styles.sectionText}>
            Indien data buiten de EU wordt verwerkt, zorgen wij voor passende beschermingsmaatregelen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Bewaartermijnen</Text>
          <Text style={styles.sectionText}>
            Gegevens worden niet langer bewaard dan nodig is voor het doel.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Beveiligingsmaatregelen</Text>
          <Text style={styles.sectionText}>
            Wij gebruiken encryptie, toegangscontrole en audits om data te beschermen.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Rechten van gebruikers</Text>
          <Text style={styles.sectionText}>
            Je hebt recht op inzage, correctie, verwijdering, beperking en bezwaar.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Cookies en tracking</Text>
          <Text style={styles.sectionText}>
            Wij kunnen cookies en analysetools gebruiken om prestaties te verbeteren.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Wijzigingen</Text>
          <Text style={styles.sectionText}>
            Wij kunnen deze privacyverklaring aanpassen indien nodig.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact</Text>
          <Text style={styles.sectionText}>
            Neem contact op via de supportpagina voor privacyvragen.
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
