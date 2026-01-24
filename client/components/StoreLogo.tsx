import React from "react";
import { View, Image, StyleSheet } from "react-native";

import logoAlbertHeijn from "../../assets/images/logo-albert-heijn.png";
import logoJumbo from "../../assets/images/logo-jumbo.png";
import logoLidl from "../../assets/images/logo-lidl.png";
import logoAldi from "../../assets/images/logo-aldi.png";
import logoPlus from "../../assets/images/logo-plus.png";
import logoDirk from "../../assets/images/logo-dirk.png";
import logoHoogvliet from "../../assets/images/logo-hoogvliet.png";
import logoDeka from "../../assets/images/logo-deka.png";
import logoCoop from "../../assets/images/logo-coop.png";
import logoSpar from "../../assets/images/logo-spar.png";

interface StoreLogoProps {
  storeName: string;
  size?: number;
}

const STORE_LOGOS: Record<string, any> = {
  "albert heijn": logoAlbertHeijn,
  "ah": logoAlbertHeijn,
  "jumbo": logoJumbo,
  "lidl": logoLidl,
  "aldi": logoAldi,
  "plus": logoPlus,
  "dirk": logoDirk,
  "hoogvliet": logoHoogvliet,
  "deka": logoDeka,
  "deka markt": logoDeka,
  "dekamarkt": logoDeka,
  "coop": logoCoop,
  "spar": logoSpar,
};

export function StoreLogo({ storeName, size = 32 }: StoreLogoProps) {
  const normalizedName = storeName.toLowerCase().trim();
  const logoSource = STORE_LOGOS[normalizedName];

  if (logoSource) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Image
          source={logoSource}
          style={[styles.logo, { width: size, height: size, borderRadius: size / 6 }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: "#666666",
        },
      ]}
    >
      <Image
        source={logoAlbertHeijn}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}

export const ALL_STORES = [
  { id: "albert-heijn", name: "Albert Heijn" },
  { id: "jumbo", name: "Jumbo" },
  { id: "lidl", name: "Lidl" },
  { id: "aldi", name: "Aldi" },
  { id: "plus", name: "Plus" },
  { id: "dirk", name: "Dirk" },
  { id: "hoogvliet", name: "Hoogvliet" },
  { id: "deka", name: "Deka" },
  { id: "coop", name: "Coop" },
  { id: "spar", name: "Spar" },
];

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fallbackContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});
