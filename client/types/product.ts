export interface Store {
  id: string;
  name: string;
  logo: string;
}

export interface ProductPrice {
  storeId: string;
  storeName: string;
  price: number;
  pricePerUnit?: string;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image?: string;
  prices: ProductPrice[];
  lowestPrice: number;
  lowestPriceStore: string;
}

export interface ShoppingListItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  lowestPrice: number;
  lowestPriceStore: string;
  allPrices?: ProductPrice[];
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  totalPrice: number;
  cheapestStore?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreRecommendation {
  storeName: string;
  storeId: string;
  totalPrice: number;
  itemsAvailable: number;
  totalItems: number;
  savings: number;
}

export interface SearchResult {
  products: Product[];
  query: string;
  isLoading: boolean;
}

export const STORES: Store[] = [
  { id: "albert-heijn", name: "Albert Heijn", logo: "AH" },
  { id: "jumbo", name: "Jumbo", logo: "JB" },
  { id: "lidl", name: "Lidl", logo: "LI" },
  { id: "aldi", name: "Aldi", logo: "AL" },
  { id: "plus", name: "Plus", logo: "PL" },
  { id: "dirk", name: "Dirk", logo: "DK" },
  { id: "hoogvliet", name: "Hoogvliet", logo: "HV" },
  { id: "deka", name: "Deka", logo: "DM" },
  { id: "coop", name: "Coop", logo: "CO" },
  { id: "spar", name: "Spar", logo: "SP" },
];
