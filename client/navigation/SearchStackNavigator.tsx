import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SearchScreen from "@/screens/SearchScreen";
import ProductDetailScreen from "@/screens/ProductDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Product } from "@/types/product";

export type SearchStackParamList = {
  Search: undefined;
  ProductDetail: { productId: string; product?: Product };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
