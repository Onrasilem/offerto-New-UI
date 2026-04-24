# Offerto Design System

## 🎨 Voor Designers

Deze app heeft een moderne, professionele design foundation. Alle design tokens zijn gedocumenteerd en klaar voor customization.

---

## 📋 Design Tokens

### Kleuren

**Primary Brand**
```
Primary 500: #3B82F6 (Main brand color)
Primary 600: #2563EB (Hover/Active state)
Primary 100: #DBEAFE (Light backgrounds)
```

**Semantic Colors**
```
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
Info: #3B82F6 (Blue)
```

**Neutrals**
```
Gray 900: #111827 (Text primary)
Gray 600: #4B5563 (Text secondary)
Gray 400: #9CA3AF (Text disabled)
Gray 200: #E5E7EB (Borders)
Gray 50: #F9FAFB (Background)
```

---

### Typografie

**Font Sizes**
```
H1: 30px / bold
H2: 24px / semibold
H3: 20px / semibold
Body: 16px / regular
Small: 14px / regular
Caption: 12px / regular
```

**Font Weights**
```
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

---

### Spacing Scale

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 32px
4xl: 40px
```

---

### Border Radius

```
sm: 4px
md: 8px
lg: 12px (default voor cards/buttons)
xl: 16px
full: 9999px (volledig rond)
```

---

### Shadows

```
sm: Subtiele shadow voor kleine elementen
md: Standaard card shadow
lg: Elevated components (modals, dropdowns)
xl: High priority elements
```

---

## 🧩 Components

### Button

**Variants:**
- `primary` - Brand color, voor primaire acties
- `secondary` - Light gray, voor secundaire acties
- `outline` - Transparant met border
- `ghost` - Geen background
- `danger` - Red, voor destructive acties
- `success` - Green, voor positive acties

**Sizes:**
- `sm` - 36px height
- `md` - 44px height (default)
- `lg` - 52px height

**Props:**
```javascript
<Button
  title="Button text"
  variant="primary"
  size="md"
  loading={false}
  disabled={false}
  fullWidth={false}
  icon="✓"
  onPress={() => {}}
/>
```

---

### Card

**Variants:**
- `elevated` - Witte card met shadow (default)
- `outlined` - Border, geen shadow
- `filled` - Light gray background

**Padding:**
- `none` - 0px
- `sm` - 8px
- `md` - 16px (default)
- `lg` - 24px

**Props:**
```javascript
<Card
  variant="elevated"
  padding="md"
  onPress={() => {}} // Optional, maakt het tappable
>
  <Text>Card content</Text>
</Card>
```

---

### Input

**Features:**
- Label support
- Error states
- Helper text
- Left/right icons
- Multiline support
- Focus states

**Props:**
```javascript
<Input
  label="Email"
  placeholder="your@email.com"
  value={email}
  onChangeText={setEmail}
  error="Invalid email"
  helper="We'll never share your email"
  leftIcon={<Icon name="mail" />}
  rightIcon={<Icon name="check" />}
/>
```

---

## 📱 Screens Geïmplementeerd

### ✅ StartScreen (Modern)
- Header met welkomstbericht
- Quick stats (3 kaarten)
- Primary action button
- Menu items met subtitles
- Clean, spacious layout

### ⚠️ Nog Te Doen (voor designer)
- Dashboard (heeft data, maar basic UI)
- Archive/Document list
- Wizard flow (3 steps)
- Login/Signup
- Settings
- Payment overview
- Product catalog

---

## 🎯 Design Brief Template

Gebruik deze template bij het inhuren van een designer:

```
PROJECT: Offerto Invoice & Quotation App
TARGET: Dutch/Belgian freelancers & small businesses
BUDGET: €[your budget]
TIMELINE: 3-4 weeks

WHAT WE NEED:
1. Logo + brand colors (refresh or keep current blue)
2. 8 core screens in Figma:
   - Dashboard (revenue stats, charts, recent docs)
   - Document list/archive (search, filter)
   - Document wizard (3 steps: client → items → review)
   - Document detail view
   - Login/Signup screens
   - Settings screen
   - Payment overview
   - Product catalog

3. Component refinements:
   - Buttons (current: working, can be better)
   - Cards (current: basic)
   - Form inputs (current: functional)
   - Navigation (needs tab bar design)

4. Design system documentation:
   - All spacing/colors/typography in Figma
   - Component variants
   - Responsive behavior

CURRENT STATE:
- Working app with professional foundation
- Modern theme tokens implemented
- All components are customizable
- See: src/theme/index.js + src/components/

STYLE DIRECTION:
- Modern B2B SaaS (like Stripe, Linear, Notion)
- Professional, clean, trustworthy
- Mobile-first but works on tablet
- NOT: Playful, gamified, consumer-app style

DELIVERABLES:
- Figma file with all screens
- Design system (colors, typography, components)
- Exported assets (logo, icons)
- 2 revision rounds

ACCESS:
- Can provide Expo link to test current app
- GitHub access if needed for implementation
```

---

## 🛠️ Implementation Guide

**Na design handoff:**

1. **Extract tokens** van designer
   - Update `src/theme/index.js`
   - Kleuren, fonts, spacing

2. **Update components**
   - `src/components/Button.js`
   - `src/components/Card.js`
   - `src/components/Input.js`

3. **Build screens**
   - Start met Dashboard
   - Dan Wizard flow
   - Dan rest

4. **Review met designer**
   - Side-by-side comparison
   - Adjustments

5. **Polish**
   - Animations
   - Loading states
   - Empty states

**Verwachte tijd:** 1-2 weken implementatie

---

## 📦 Files Overzicht

```
src/
├── theme/
│   └── index.js          # Alle design tokens
├── components/
│   ├── Button.js         # Modern button component
│   ├── Card.js           # Card component
│   ├── Input.js          # Input component
│   ├── UI.js             # Legacy components (backward compatible)
│   └── index.js          # Export all
└── screens/
    └── Core/
        └── StartScreen.js # Modern example screen
```

---

## 🎨 Design Resources

**Recommended Tools:**
- **Figma** (Design & prototyping)
- **Coolors.co** (Color palettes)
- **Google Fonts** (Typography)
- **Iconscout** or **Feather Icons** (Icon sets)

**Inspiration:**
- Stripe Dashboard
- Linear App
- Notion
- Mercury (banking app)
- Invoice Ninja

---

## 💰 Budget Guidelines

**€500-1000:** Basic refresh (logo + colors + key screens)
**€1500-2500:** Complete design (all screens + system)
**€3000+:** Premium (research + multiple iterations)

---

## ✅ Quality Checklist

Na designer handoff, check:
- [ ] Alle kleuren gedocumenteerd in hex
- [ ] Font sizes + weights gedocumenteerd
- [ ] Spacing consistent (8px grid systeem)
- [ ] Component states (hover, disabled, error)
- [ ] Responsive behavior (mobile + tablet)
- [ ] Dark mode (optioneel)
- [ ] Icons consistent (single style/library)
- [ ] Empty states designed
- [ ] Loading states designed
- [ ] Error states designed

---

## 🚀 Ready to Start?

De foundation is klaar! Designer kan:
1. Bekijk de huidige app (via Expo link)
2. Zie de theme tokens in `src/theme/index.js`
3. Bouw in Figma bovenop deze foundation
4. Implementatie is plug-and-play

**Contact:** [Your email/contact info]
