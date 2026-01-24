# Design Guidelines: Boodschappen Vergelijker (Grocery Price Comparison App)

## Brand Identity

**Purpose**: Help Dutch shoppers find the cheapest groceries instantly by comparing prices across all major supermarkets using AI-powered search.

**Aesthetic Direction**: Editorial/Magazine - Clean typographic hierarchy, organized data presentation, trustworthy and efficient. Think consumer reports meets modern shopping assistant.

**Memorable Element**: Bold price comparison cards with color-coded savings indicators. The app feels like a smart shopping guide that saves you money effortlessly.

## Navigation Architecture

**Root Navigation**: Tab Navigation (3 tabs)

### Screens List:
1. **Zoeken** (Search/Home) - Main search and results
2. **Lijsten** (Lists) - Shopping lists management
3. **Profiel** (Profile) - Account and settings
4. Login/Signup (modal, shown on first launch)
5. Product Details (stack screen)
6. Store Comparison (stack screen)
7. Create List (modal)

## Screen Specifications

### 1. Login/Signup Screen
- **Purpose**: Authenticate user via SSO
- **Layout**: 
  - Transparent header, no buttons
  - Centered content (non-scrollable)
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: 
  - App logo/illustration at top
  - Headline: "De slimste boodschappen doen"
  - Apple Sign-In button
  - Google Sign-In button
  - Privacy policy/terms links (small text)

### 2. Zoeken Tab (Search/Home)
- **Purpose**: Search products and compare prices
- **Layout**:
  - Custom header with large search bar (sticky)
  - Scrollable content area
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Search bar with AI indicator icon
  - Recent searches (chips, horizontally scrollable)
  - Popular products grid
  - Empty state: illustration when no search performed
- **Search Results State**:
  - Product cards showing: product name, best price, store logo, price comparison badge
  - Filter chips: store selection, category
  - Sort options: goedkoopste eerst, alphabetisch

### 3. Product Details Screen
- **Purpose**: Show detailed price comparison for single product
- **Layout**:
  - Default navigation header with back button, share button (right)
  - Scrollable content
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - Product image (if available)
  - Product name (large, bold)
  - Price comparison table: store name, price, price per unit, availability
  - "Laagste prijs" badge on cheapest option
  - "Toevoegen aan lijst" floating button (bottom right)

### 4. Store Comparison Screen
- **Purpose**: Compare total cart price across stores
- **Layout**:
  - Default header with back button
  - Scrollable list
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - Selected products summary (collapsible)
  - Store comparison cards: store logo, total price, savings amount, availability count
  - "Bekijk details" button per store

### 5. Lijsten Tab (Shopping Lists)
- **Purpose**: Manage shopping lists
- **Layout**:
  - Custom header: "Lijsten" title, plus button (right)
  - Scrollable list
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Shopping list cards: list name, item count, total estimated price, cheapest store indicator
  - Empty state: illustration with "Maak je eerste boodschappenlijst"
  - Floating action button: "Nieuwe Lijst" (if using 4-tab variant)

### 6. Create/Edit List Screen (Modal)
- **Purpose**: Create or modify shopping list
- **Layout**:
  - Header with "Annuleer" (left), "Bewaar" (right)
  - Scrollable form
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - List name input field
  - Add products search bar
  - Selected products list (swipe to delete)
  - Total price estimate

### 7. Profiel Tab (Profile)
- **Purpose**: Account settings and preferences
- **Layout**:
  - Transparent header
  - Scrollable content
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - User avatar (generated preset)
  - Display name
  - Preferred stores selection
  - Notification preferences
  - Settings > Account > Log out, Delete account
  - Privacy policy, terms, contact links

## Color Palette

- **Primary**: #FF6B35 (energetic orange - savings/deals)
- **Primary Variant**: #CC5529
- **Secondary**: #004E89 (trustworthy blue)
- **Background**: #FAFAFA
- **Surface**: #FFFFFF
- **Text Primary**: #1A1A1A
- **Text Secondary**: #666666
- **Success (Savings)**: #00A86B
- **Error**: #E63946
- **Border**: #E0E0E0
- **Glass White**: rgba(255, 255, 255, 0.85)
- **Glass Border**: rgba(255, 255, 255, 0.3)

## Welcome Screen Style (Mountain Theme)

- Full-screen mountain background image (assets/images/mountain-background.png)
- Glass morphism cards with frosted effect (expo-blur BlurView)
- White text overlays on mountain background
- Elegant typography with shadows for readability
- Search bar with glass effect styling
- Store logos displayed in glass card

## Typography

**Font**: Montserrat (bold, confident) for headings, System font for body
- **H1**: Montserrat Bold, 28pt
- **H2**: Montserrat SemiBold, 22pt
- **H3**: Montserrat SemiBold, 18pt
- **Body**: System Regular, 16pt
- **Caption**: System Regular, 14pt
- **Price Large**: Montserrat Bold, 32pt
- **Price Small**: Montserrat SemiBold, 20pt

## Visual Design
- Product cards have subtle border, no shadow
- Floating buttons use drop shadow: offset (0,2), opacity 0.10, radius 2
- Price comparison badges use bold typography and success color
- Icons: Feather icons from @expo/vector-icons
- All touchables show press feedback (opacity 0.7)

## Assets to Generate

1. **icon.png** - App icon featuring shopping cart with price tag symbol | WHERE USED: Device home screen
2. **splash-icon.png** - Simplified app icon for splash | WHERE USED: App launch screen
3. **empty-search.png** - Illustration of magnifying glass with groceries | WHERE USED: Zoeken tab before search
4. **empty-lists.png** - Illustration of empty shopping basket | WHERE USED: Lijsten tab when no lists
5. **login-hero.png** - Illustration of happy shopper with savings | WHERE USED: Login/signup screen
6. **avatar-default.png** - Preset user avatar (shopping bag icon) | WHERE USED: Profile tab