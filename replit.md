# Kiwi - Boodschappen Vergelijker

## Overview

Kiwi (branded as "Kiwi - Boodschappen Vergelijker") is a Dutch grocery price comparison mobile application built with Expo/React Native. The app helps Dutch shoppers find the cheapest groceries by comparing prices across 10 major Dutch supermarkets (Albert Heijn, Jumbo, Lidl, Aldi, Plus, Dirk, Hoogvliet, Deka Markt, Coop, Spar) using AI-powered search. The application follows an editorial/magazine aesthetic with clean typography and color-coded savings indicators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Expo SDK 54 with React Native 0.81, targeting iOS, Android, and Web platforms.

**Navigation Structure**:
- Root stack navigator containing main tab navigator and modals
- Three main tabs: Search (Zoeken), Lists (Lijsten), Profile (Profiel)
- Each tab has its own stack navigator for nested screens
- Uses React Navigation v7 with native stack navigators

**State Management**:
- TanStack Query (React Query) for server state and API caching
- AsyncStorage for local persistence (shopping lists, recent searches)
- React hooks for component-level state

**UI/Styling Approach**:
- Custom theming system with light/dark mode support via `useTheme` hook
- Montserrat font family for typography
- Reanimated for smooth animations on interactive components
- BlurView for iOS tab bar transparency effects
- Component library includes: Button, Card, SearchBar, ProductCard, EmptyState, LoadingSkeleton

**Key Design Patterns**:
- Path aliases: `@/` maps to `./client`, `@shared/` maps to `./shared`
- Keyboard-aware scroll views for form screens
- Error boundaries with fallback UI
- Haptic feedback on user interactions

### Backend Architecture

**Framework**: Express.js v5 running on Node.js with TypeScript.

**API Design**:
- RESTful endpoints under `/api/` prefix
- JSON request/response format
- CORS configured for Replit domains and localhost development

**AI Integration**:
- OpenAI API via Replit AI Integrations for product search
- AI generates realistic Dutch supermarket product data with prices
- Structured JSON responses with product names, categories, and store-specific pricing

**Database**:
- PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- Current schema includes users table and chat-related tables (conversations, messages)
- In-memory storage fallback available via `MemStorage` class

**Replit Integration Modules** (in `server/replit_integrations/`):
- Audio: Voice chat with speech-to-text/text-to-speech
- Chat: Conversation persistence and streaming
- Image: Image generation via gpt-image-1
- Batch: Rate-limited batch processing utilities

### Data Flow

1. User searches for products via SearchBar component
2. Frontend sends POST to `/api/search` with query
3. Backend uses OpenAI to generate product/price data
4. Results cached and displayed in ProductCard components
5. Users can add products to shopping lists (stored in AsyncStorage)
6. Product details show price comparison across all stores

## External Dependencies

### Third-Party Services

- **OpenAI API** (via Replit AI Integrations): Powers product search, generates price comparisons, and provides chat/voice capabilities
- **Expo Services**: Build system, splash screen, fonts, haptics, image handling

### Database

- **PostgreSQL**: Primary database configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema in `shared/schema.ts`
- **Drizzle Kit**: Database migrations in `./migrations` directory

### Key npm Dependencies

- `expo` / `react-native`: Mobile app framework
- `@react-navigation/*`: Navigation stack
- `@tanstack/react-query`: Data fetching and caching
- `drizzle-orm` / `drizzle-zod`: Database ORM with Zod validation
- `openai`: OpenAI API client
- `express`: Backend server
- `react-native-reanimated`: Animations
- `expo-haptics`: Haptic feedback
- `@react-native-async-storage/async-storage`: Local storage

### Environment Variables Required

- `DATABASE_URL`: PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests
- `REPLIT_DEV_DOMAIN`: Development domain (set automatically by Replit)