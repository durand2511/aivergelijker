import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, shoppingLists, shoppingListItems, sessions, registerSchema, loginSchema } from "@shared/schema";
import { gt } from "drizzle-orm";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const verifiedSessions = new Map<string, { verified: boolean; expiresAt: number }>();
const sessionChallenges = new Map<string, { num1: number; num2: number; answer: number }>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;
const SESSION_VALIDITY = 30 * 60 * 1000;

function generateChallenge(): { num1: number; num2: number; answer: number } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return { num1, num2, answer: num1 + num2 };
}

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(sessionId);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  limit.count++;
  return true;
}

interface ProductPrice {
  storeId: string;
  storeName: string;
  price: number;
  pricePerUnit?: string;
  available: boolean;
}

interface Product {
  id: string;
  name: string;
  ingredientAmount?: string;
  category: string;
  image?: string;
  prices: ProductPrice[];
  lowestPrice: number;
  lowestPriceStore: string;
}

const productCache = new Map<string, Product>();

async function searchSupermarktPrices(query: string): Promise<string> {
  if (!SERPAPI_KEY) {
    return "Geen SerpAPI key beschikbaar";
  }

  try {
    // Search specifically for prices on supermarktscanner.nl which has real Dutch supermarket prices
    const searchQuery = `${query} prijs euro supermarktscanner OR allerhande OR ah.nl OR jumbo.com site:supermarktscanner.nl OR site:ah.nl OR site:jumbo.com`;
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&location=Netherlands&hl=nl&gl=nl&num=15&api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("SerpAPI error:", data.error);
      return `SerpAPI fout: ${data.error}`;
    }

    let priceInfo = "";
    
    // Shopping results often have direct prices
    if (data.shopping_results && data.shopping_results.length > 0) {
      priceInfo += "WINKELPRIJZEN:\n";
      data.shopping_results.slice(0, 10).forEach((item: any) => {
        const price = item.extracted_price || item.price || "";
        priceInfo += `- ${item.title}: ${price} bij ${item.source || "onbekend"}\n`;
      });
    }
    
    // Check inline shopping results (Google often puts these inline)
    if (data.inline_shopping && data.inline_shopping.length > 0) {
      priceInfo += "\nINLINE WINKELPRIJZEN:\n";
      data.inline_shopping.slice(0, 8).forEach((item: any) => {
        const price = item.extracted_price || item.price || "";
        priceInfo += `- ${item.title}: ${price} bij ${item.source || "onbekend"}\n`;
      });
    }
    
    // Organic results for price context
    if (data.organic_results && data.organic_results.length > 0) {
      priceInfo += "\nZOEKRESULTATEN:\n";
      data.organic_results.slice(0, 8).forEach((result: any) => {
        // Look for prices in snippets (often formatted as €X,XX or X.XX)
        const snippet = result.snippet || "";
        priceInfo += `- ${result.title}: ${snippet}\n`;
      });
    }

    if (data.answer_box) {
      priceInfo += `\nDIRECT ANTWOORD: ${data.answer_box.answer || data.answer_box.snippet || ""}\n`;
    }

    console.log("Full SerpAPI price info:", priceInfo);
    return priceInfo || "Geen prijsinformatie gevonden";
  } catch (error) {
    console.error("SerpAPI fetch error:", error);
    return "Kon geen prijzen ophalen";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/challenge/get", (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }
    
    const challenge = generateChallenge();
    sessionChallenges.set(sessionId, challenge);
    
    res.json({ 
      num1: challenge.num1, 
      num2: challenge.num2,
      question: `Wat is ${challenge.num1} + ${challenge.num2}?`
    });
  });

  app.post("/api/challenge/verify", (req, res) => {
    try {
      const { answer, sessionId } = req.body;

      if (answer === undefined || answer === null) {
        return res.status(400).json({ error: "Answer is required" });
      }

      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const challenge = sessionChallenges.get(sessionId);
      if (!challenge) {
        return res.status(400).json({ error: "No challenge found. Please request a new one." });
      }

      const userAnswer = parseInt(answer, 10);
      if (isNaN(userAnswer)) {
        return res.status(400).json({ error: "Invalid answer format" });
      }

      if (userAnswer === challenge.answer) {
        verifiedSessions.set(sessionId, { 
          verified: true, 
          expiresAt: Date.now() + SESSION_VALIDITY 
        });
        sessionChallenges.delete(sessionId);
        res.json({ success: true, verified: true });
      } else {
        const newChallenge = generateChallenge();
        sessionChallenges.set(sessionId, newChallenge);
        res.status(400).json({ 
          success: false, 
          error: "Onjuist antwoord. Probeer opnieuw.",
          newChallenge: {
            num1: newChallenge.num1,
            num2: newChallenge.num2,
            question: `Wat is ${newChallenge.num1} + ${newChallenge.num2}?`
          }
        });
      }
    } catch (error) {
      console.error("Challenge verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/challenge/status", (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }
    
    const now = Date.now();
    const session = verifiedSessions.get(sessionId);
    const verified = session ? session.verified && session.expiresAt > now : false;
    
    if (session && session.expiresAt <= now) {
      verifiedSessions.delete(sessionId);
    }
    
    res.json({ verified });
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { query, sessionId } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      const now = Date.now();
      const session = verifiedSessions.get(sessionId);
      const isVerified = session && session.verified && session.expiresAt > now;
      
      if (!sessionId || !isVerified) {
        return res.status(403).json({ error: "Verificatie vereist", needsCaptcha: true });
      }

      if (!checkRateLimit(sessionId)) {
        return res.status(429).json({ error: "Te veel zoekopdrachten. Wacht even en probeer opnieuw." });
      }

      // Support multiple products separated by comma
      const searchTerms = query.split(',').map(q => q.trim()).filter(q => q.length > 0);
      const isMultiSearch = searchTerms.length > 1;
      
      // For multiple items, search each one and combine results
      let combinedPrices = "";
      if (isMultiSearch) {
        console.log(`Multi-search for ${searchTerms.length} items: ${searchTerms.join(', ')}`);
        const priceResults = await Promise.all(
          searchTerms.slice(0, 10).map(async (term) => {
            const prices = await searchSupermarktPrices(term);
            return `\n=== ${term.toUpperCase()} ===\n${prices}`;
          })
        );
        combinedPrices = priceResults.join('\n');
      } else {
        combinedPrices = await searchSupermarktPrices(query);
      }
      
      console.log("Web prices found:", combinedPrices.substring(0, 500));

      const searchItemsList = isMultiSearch ? searchTerms.join(', ') : query;
      
      const systemPrompt = `Je bent een Nederlandse supermarkt prijsvergelijker AI.
Je MOET echte prijzen uit de zoekresultaten gebruiken - GEEN verzonnen prijzen!

ZOEKOPDRACHT: ${searchItemsList}
${isMultiSearch ? `Dit is een BOODSCHAPPENLIJST met ${searchTerms.length} items. Genereer EEN product per item.` : ''}

WINKELS (gebruik altijd deze exacte namen en ID's):
- Albert Heijn (id: albert-heijn)
- Jumbo (id: jumbo)
- Lidl (id: lidl)
- Aldi (id: aldi)
- Plus (id: plus)
- Dirk (id: dirk)
- Hoogvliet (id: hoogvliet)
- Deka Markt (id: deka)
- Coop (id: coop)
- Spar (id: spar)

ECHTE PRIJSINFORMATIE VAN INTERNET:
${combinedPrices}

KRITIEKE REGELS:
1. ZOEK naar euro prijzen in de zoekresultaten hierboven (bijv. €1,49 of 1.49)
2. ${isMultiSearch ? `Genereer PRECIES ${searchTerms.length} producten - één voor elk item` : 'Genereer 1-2 producten voor de zoekopdracht'}
3. ALLEEN prijzen tonen die je ECHT VINDT in de zoekresultaten
4. Als je GEEN prijs vindt voor een winkel: LAAT DIE WINKEL WEG uit de prices array
5. SCHAT GEEN prijzen - alleen echte gevonden prijzen

BELANGRIJK:
- Voeg ALLEEN winkels toe waarvoor je een ECHTE prijs vindt
- Als je geen prijzen vindt, retourneer een lege products array
- GEEN geschatte of verzonnen prijzen - alleen gevonden data

Retourneer ALLEEN geldige JSON:
{
  "products": [
    {
      "id": "unieke-id",
      "name": "Product Naam",
      "category": "Categorie",
      "prices": [
        {
          "storeId": "albert-heijn",
          "storeName": "Albert Heijn",
          "price": 0.85,
          "pricePerUnit": "€5.67/kg",
          "available": true
        }
      ]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Zoek producten voor: ${query}` },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        data = { products: [] };
      }

      const products: Product[] = (data.products || []).map((p: any) => {
        const prices: ProductPrice[] = (p.prices || []).map((pr: any) => ({
          storeId: pr.storeId || "",
          storeName: pr.storeName || "",
          price: Number(pr.price) || 0,
          pricePerUnit: pr.pricePerUnit,
          available: pr.available !== false,
        }));

        const availablePrices = prices.filter((pr) => pr.available);
        const lowestPriceItem = availablePrices.reduce(
          (min, pr) => (pr.price < min.price ? pr : min),
          availablePrices[0] || { price: 0, storeName: "" }
        );

        const product: Product = {
          id: p.id || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: p.name || "Onbekend product",
          category: p.category || "Overig",
          prices,
          lowestPrice: lowestPriceItem?.price || 0,
          lowestPriceStore: lowestPriceItem?.storeName || "",
        };

        productCache.set(product.id, product);
        return product;
      });

      res.json({ products, query });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Zoeken is mislukt" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const cachedProduct = productCache.get(id);
      if (cachedProduct) {
        return res.json({ product: cachedProduct });
      }

      res.status(404).json({ error: "Product niet gevonden" });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Kon product niet ophalen" });
    }
  });

  app.get("/api/stores", async (req, res) => {
    const stores = [
      { id: "albert-heijn", name: "Albert Heijn", logo: "AH" },
      { id: "jumbo", name: "Jumbo", logo: "JB" },
      { id: "lidl", name: "Lidl", logo: "LI" },
      { id: "aldi", name: "Aldi", logo: "AL" },
      { id: "plus", name: "Plus", logo: "PL" },
      { id: "dirk", name: "Dirk", logo: "DK" },
      { id: "hoogvliet", name: "Hoogvliet", logo: "HV" },
      { id: "deka", name: "Deka Markt", logo: "DM" },
      { id: "coop", name: "Coop", logo: "CO" },
      { id: "spar", name: "Spar", logo: "SP" },
    ];
    res.json({ stores });
  });

  app.post("/api/recipe", async (req, res) => {
    try {
      const { recipe, sessionId } = req.body;

      if (!recipe || typeof recipe !== "string") {
        return res.status(400).json({ error: "Recept naam is verplicht" });
      }

      const now = Date.now();
      const session = verifiedSessions.get(sessionId);
      const isVerified = session && session.verified && session.expiresAt > now;
      
      if (!sessionId || !isVerified) {
        return res.status(403).json({ error: "Verificatie vereist", needsCaptcha: true });
      }

      if (!checkRateLimit(sessionId)) {
        return res.status(429).json({ error: "Te veel zoekopdrachten. Wacht even en probeer opnieuw." });
      }

      const ingredientPrompt = `Je bent een expert in Nederlandse recepten en boodschappen.
Gegeven het recept "${recipe}", geef een lijst van alle benodigde ingrediënten.

Retourneer ALLEEN geldige JSON:
{
  "recipeName": "Naam van het recept",
  "servings": 4,
  "ingredients": [
    { "name": "melk", "amount": "500ml", "searchTerm": "volle melk" },
    { "name": "eieren", "amount": "4 stuks", "searchTerm": "eieren" }
  ]
}

Regels:
1. Geef realistische hoeveelheden voor 4 personen
2. Het searchTerm moet een goede zoekopdracht zijn voor supermarkt prijzen
3. Maximaal 15 ingrediënten`;

      const ingredientResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: ingredientPrompt },
          { role: "user", content: `Geef ingrediënten voor: ${recipe}` },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const ingredientContent = ingredientResponse.choices[0]?.message?.content || "{}";
      let ingredientData;
      try {
        ingredientData = JSON.parse(ingredientContent);
      } catch {
        ingredientData = { recipeName: recipe, servings: 4, ingredients: [] };
      }

      const ingredients = ingredientData.ingredients || [];
      const allProducts: Product[] = [];

      for (const ingredient of ingredients.slice(0, 10)) {
        const searchTerm = ingredient.searchTerm || ingredient.name;
        const webPrices = await searchSupermarktPrices(searchTerm);

        const productPrompt = `Je bent een Nederlandse supermarkt prijsvergelijker AI.

WINKELS:
- Albert Heijn (id: albert-heijn)
- Jumbo (id: jumbo)
- Lidl (id: lidl)
- Aldi (id: aldi)
- Plus (id: plus)
- Dirk (id: dirk)
- Hoogvliet (id: hoogvliet)
- Deka Markt (id: deka)
- Coop (id: coop)
- Spar (id: spar)

PRIJSINFORMATIE:
${webPrices}

Genereer 1 product voor "${searchTerm}" met prijzen bij alle winkels.
Retourneer ALLEEN JSON:
{
  "product": {
    "id": "unieke-id",
    "name": "Product Naam",
    "category": "${ingredient.name}",
    "ingredientAmount": "${ingredient.amount}",
    "prices": [
      { "storeId": "albert-heijn", "storeName": "Albert Heijn", "price": 0.85, "available": true }
    ]
  }
}`;

        try {
          const productResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: productPrompt },
              { role: "user", content: `Product voor: ${searchTerm}` },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 512,
          });

          const productContent = productResponse.choices[0]?.message?.content || "{}";
          const productData = JSON.parse(productContent);
          
          if (productData.product) {
            const p = productData.product;
            const prices: ProductPrice[] = (p.prices || []).map((pr: any) => ({
              storeId: pr.storeId || "",
              storeName: pr.storeName || "",
              price: Number(pr.price) || 0,
              pricePerUnit: pr.pricePerUnit,
              available: pr.available !== false,
            }));

            const availablePrices = prices.filter((pr) => pr.available);
            const lowestPriceItem = availablePrices.reduce(
              (min, pr) => (pr.price < min.price ? pr : min),
              availablePrices[0] || { price: 0, storeName: "" }
            );

            allProducts.push({
              id: p.id || `ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: p.name || searchTerm,
              category: ingredient.name,
              ingredientAmount: ingredient.amount,
              prices,
              lowestPrice: lowestPriceItem?.price || 0,
              lowestPriceStore: lowestPriceItem?.storeName || "",
            });
          }
        } catch (err) {
          console.error(`Error searching for ${searchTerm}:`, err);
        }
      }

      const storeTotals: Record<string, number> = {};
      const storeNames = ["Albert Heijn", "Jumbo", "Lidl", "Aldi", "Plus", "Dirk", "Hoogvliet", "Deka Markt", "Coop", "Spar"];
      
      for (const store of storeNames) {
        let total = 0;
        for (const product of allProducts) {
          const storePrice = product.prices.find(
            (p) => p.storeName.toLowerCase() === store.toLowerCase() && p.available
          );
          if (storePrice) {
            total += storePrice.price;
          }
        }
        storeTotals[store] = Math.round(total * 100) / 100;
      }

      const cheapestStore = Object.entries(storeTotals).reduce(
        (min, [store, total]) => (total > 0 && (min.total === 0 || total < min.total) ? { store, total } : min),
        { store: "", total: 0 }
      );

      res.json({
        recipeName: ingredientData.recipeName || recipe,
        servings: ingredientData.servings || 4,
        ingredients: allProducts,
        storeTotals,
        cheapestStore: cheapestStore.store,
        cheapestTotal: cheapestStore.total,
      });
    } catch (error) {
      console.error("Recipe search error:", error);
      res.status(500).json({ error: "Recept zoeken mislukt" });
    }
  });

  // Auth Sessions (database-based for persistence across restarts)
  function generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async function getSessionFromDb(token: string): Promise<{ userId: string } | null> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await db.delete(sessions).where(eq(sessions.token, token));
      return null;
    }
    // Extend session by 7 days on each use (sliding window)
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.token, token));
    return { userId: session.userId };
  }

  async function createSessionInDb(token: string, userId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({ token, userId, expiresAt });
  }

  async function deleteSessionFromDb(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Ongeldige gegevens", details: result.error.issues });
        return;
      }

      const { email, password, name, gender } = result.data;

      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        res.status(400).json({ error: "Dit e-mailadres is al geregistreerd" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
        gender,
      }).returning();

      // Create session in database
      const token = generateToken();
      await createSessionInDb(token, newUser.id);

      res.json({
        success: true,
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name, gender: newUser.gender },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registratie mislukt" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "Ongeldige gegevens" });
        return;
      }

      const { email, password } = result.data;

      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        res.status(401).json({ error: "E-mail of wachtwoord incorrect" });
        return;
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        res.status(401).json({ error: "E-mail of wachtwoord incorrect" });
        return;
      }

      // Create session in database
      const token = generateToken();
      await createSessionInDb(token, user.id);

      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, gender: user.gender },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Inloggen mislukt" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
      if (!user) {
        res.status(401).json({ error: "Gebruiker niet gevonden" });
        return;
      }

      res.json({ id: user.id, email: user.email, name: user.name, gender: user.gender });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Fout bij ophalen gebruiker" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      await deleteSessionFromDb(token);
    }
    res.json({ success: true });
  });

  // Shopping Lists API
  app.get("/api/lists", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      const lists = await db.select().from(shoppingLists).where(eq(shoppingLists.userId, session.userId));
      res.json(lists);
    } catch (error) {
      console.error("Get lists error:", error);
      res.status(500).json({ error: "Fout bij ophalen lijsten" });
    }
  });

  app.post("/api/lists", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: "Naam is verplicht" });
        return;
      }

      const [newList] = await db.insert(shoppingLists).values({
        userId: session.userId,
        name,
      }).returning();

      res.json(newList);
    } catch (error) {
      console.error("Create list error:", error);
      res.status(500).json({ error: "Fout bij maken lijst" });
    }
  });

  app.delete("/api/lists/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      // Delete items first
      await db.delete(shoppingListItems).where(eq(shoppingListItems.listId, req.params.id));
      // Delete list
      await db.delete(shoppingLists).where(eq(shoppingLists.id, req.params.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Delete list error:", error);
      res.status(500).json({ error: "Fout bij verwijderen lijst" });
    }
  });

  // List Items API
  app.get("/api/lists/:id/items", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      const items = await db.select().from(shoppingListItems).where(eq(shoppingListItems.listId, req.params.id));
      res.json(items);
    } catch (error) {
      console.error("Get items error:", error);
      res.status(500).json({ error: "Fout bij ophalen items" });
    }
  });

  app.post("/api/lists/:id/items", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      const { productId, productName, productCategory, prices } = req.body;

      const [newItem] = await db.insert(shoppingListItems).values({
        listId: req.params.id,
        productId,
        productName,
        productCategory,
        pricesJson: JSON.stringify(prices || []),
      }).returning();

      res.json(newItem);
    } catch (error) {
      console.error("Add item error:", error);
      res.status(500).json({ error: "Fout bij toevoegen item" });
    }
  });

  app.delete("/api/lists/:listId/items/:itemId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      await db.delete(shoppingListItems).where(eq(shoppingListItems.id, req.params.itemId));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete item error:", error);
      res.status(500).json({ error: "Fout bij verwijderen item" });
    }
  });

  app.patch("/api/lists/:listId/items/:itemId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        res.status(401).json({ error: "Niet ingelogd" });
        return;
      }

      const session = await getSessionFromDb(token);
      if (!session) {
        res.status(401).json({ error: "Sessie verlopen" });
        return;
      }

      const { checked } = req.body;
      await db.update(shoppingListItems).set({ checked }).where(eq(shoppingListItems.id, req.params.itemId));
      res.json({ success: true });
    } catch (error) {
      console.error("Update item error:", error);
      res.status(500).json({ error: "Fout bij bijwerken item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
