import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SearchStackNavigator from "@/navigation/SearchStackNavigator";
import ListsStackNavigator from "@/navigation/ListsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export type MainTabParamList = {
  SearchTab: undefined;
  ListsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="SearchTab"
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
        tabBarStyle: {
          position: "absolute",
          bottom: Math.max(insets.bottom, Spacing.md),
          left: Spacing.lg,
          right: Spacing.lg,
          height: 70,
          backgroundColor: "#004E89",
          borderRadius: BorderRadius.full,
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: Spacing.md,
        },
        tabBarItemStyle: {
          height: 70,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
          marginBottom: 0,
        },
        tabBarBackground: () => null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{
          title: "Zoeken",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ListsTab"
        component={ListsStackNavigator}
        options={{
          title: "Lijsten",
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profiel",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
