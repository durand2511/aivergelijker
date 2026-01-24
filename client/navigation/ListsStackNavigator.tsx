import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ListsScreen from "@/screens/ListsScreen";
import ListDetailScreen from "@/screens/ListDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ListsStackParamList = {
  Lists: undefined;
  ListDetail: { listId: string };
};

const Stack = createNativeStackNavigator<ListsStackParamList>();

export default function ListsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Lists"
        component={ListsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ListDetail"
        component={ListDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
