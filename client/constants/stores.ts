export interface Store {
  id: string;
  name: string;
  color: string;
  logo: string;
}

export const STORES: Record<string, Store> = {
  "albert-heijn": {
    id: "albert-heijn",
    name: "Albert Heijn",
    color: "#00A0E2",
    logo: "AH",
  },
  "jumbo": {
    id: "jumbo",
    name: "Jumbo",
    color: "#FFD700",
    logo: "J",
  },
  "lidl": {
    id: "lidl",
    name: "Lidl",
    color: "#0050AA",
    logo: "L",
  },
  "aldi": {
    id: "aldi",
    name: "Aldi",
    color: "#00005F",
    logo: "A",
  },
  "plus": {
    id: "plus",
    name: "Plus",
    color: "#E2001A",
    logo: "P",
  },
  "dirk": {
    id: "dirk",
    name: "Dirk",
    color: "#E30613",
    logo: "D",
  },
};

export function getStoreById(id: string): Store | undefined {
  return STORES[id.toLowerCase()];
}

export function getStoreByName(name: string): Store | undefined {
  const normalized = name.toLowerCase().replace(/\s+/g, "-");
  if (STORES[normalized]) return STORES[normalized];
  
  for (const store of Object.values(STORES)) {
    if (store.name.toLowerCase() === name.toLowerCase()) {
      return store;
    }
  }
  return undefined;
}
