# 🎨 PornoPizza Visual Design Guide

## 📐 Page Layout Structure

```
┌─────────────────────────────────────────────────┐
│                   HEADER                         │
│  [PornoPizza Logo]        [Cart 🛒 (0)]         │
└─────────────────────────────────────────────────┘
│                                                  │
│              HERO SECTION (600px)                │
│  ┌─────────────────────────────────────────┐    │
│  │ [Background: Margherita Pizza Photo]     │    │
│  │                                          │    │
│  │  Welcome to PornoPizza                   │    │
│  │  Authentic Italian pizza delivered...    │    │
│  │                                          │    │
│  │  [Order Now 🍕]  [View Menu]            │    │
│  │                                          │    │
│  │  🕐 30 Min  🍕 28+ Pizzas  ⭐ 4.8/5     │    │
│  │                                          │    │
│  │            ↓ Scroll to explore           │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│              MENU SECTION                        │
│  ┌─────────────────────────────────────────┐    │
│  │        Our Pizza Menu                    │    │
│  │  Choose from handcrafted pizzas...       │    │
│  │                                          │    │
│  │  [All Pizzas (28)] [Classic] [Premium]   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  [IMG]   │  │  [IMG]   │  │  [IMG]   │      │
│  │          │  │          │  │  PREMIUM │      │
│  │Margherita│  │   Capri  │  │  Da Vinci│      │
│  │Classic.. │  │Buffalo.. │  │Artist's..│      │
│  │€7.90 [Add│  │€8.90 [Add│  │€13.90[Add│      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  [IMG]   │  │  [IMG]   │  │  [IMG]   │      │
│  │          │  │  PREMIUM │  │  PREMIUM │      │
│  │ Prosciutto│ │  Gamberi │  │  Mayday  │      │
│  │Italian.. │  │Tiger...  │  │House...  │      │
│  │€9.90 [Add│  │€14.90[Add│  │€14.90[Add│      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ... (22 more pizza cards) ...                  │
│                                                  │
│                   FOOTER                         │
│  ┌─────────────────────────────────────────┐    │
│  │ [PornoPizza] [Quick Links] [Contact]     │    │
│  │ Authentic    Home          📍 Bratislava │    │
│  │ Italian      Menu          📞 +421...    │    │
│  │ pizza...     Order Now     ✉️ info@...   │    │
│  │              Track         🕐 11-23       │    │
│  │                                          │    │
│  │              [Follow Us]                 │    │
│  │              📘 📷 🐦                    │    │
│  │                                          │    │
│  │      © 2025 PornoPizza. All rights...   │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### **Primary Colors**
```css
--color-primary: #FF6B00        /* Vibrant Orange */
--color-primary-dark: #e65a00   /* Darker Orange (hover) */
--color-secondary: #2c3e50      /* Dark Blue-Gray */
```

### **Usage**
- **Headings:** Primary orange (#FF6B00)
- **Buttons:** Primary orange background, white text
- **Hover:** Darker orange (#e65a00)
- **Footer:** Dark gray background (#2c3e50)
- **Premium Badge:** Red (#EF4444)

---

## 📏 Spacing System

```
Spacing Scale:
- xs:  8px  (gap-2)
- sm:  16px (gap-4, p-4)
- md:  24px (gap-6, p-6)
- lg:  32px (gap-8, p-8)
- xl:  64px (py-16)
```

### **Container**
```css
container mx-auto px-4
Max width: 1280px (lg breakpoint)
```

### **Grid Layout**
```css
grid-cols-1         /* Mobile: 1 column */
md:grid-cols-2      /* Tablet: 2 columns */
lg:grid-cols-3      /* Desktop: 3 columns */
gap-8               /* 32px gap between items */
```

---

## 🎬 Animations

### **Hero Section**
```javascript
- Content slides in from left (opacity 0 → 1, x: -50 → 0)
- Staggered text reveals (delay: 0.2s, 0.4s, 0.6s)
- Scroll indicator bounces (infinite repeat)
```

### **Product Cards**
```javascript
- Fade in + slide up (opacity 0 → 1, y: 30 → 0)
- Staggered by index (delay: index * 0.05s)
- Hover: scale(1.02), shadow increase
- Image: hover scale(1.1)
```

### **Buttons**
```javascript
- Hover: scale(1.05)
- Active: scale(0.95)
- Add to cart: "🛒 Add" → "✓ Added" (green)
```

---

## 🖼️ Image Specifications

### **Hero Image**
```
Path: /images/hero/pizza-hero.jpg
Size: Full width, 600px height
Effect: Dark gradient overlay (black/70 to black/40)
```

### **Product Images**
```
Path: /images/pizzas/classic/*.jpg (13 photos)
      /images/pizzas/premium/*.jpg (15 photos)
Size: 800x800px (optimized by Next.js)
Aspect: 1:1 (square)
Effect: Zoom on hover (scale 1.1)
```

### **Placeholder**
```
Path: /images/placeholder-pizza.jpg
Fallback: 🍕 emoji on gray background
```

---

## 📱 Responsive Breakpoints

### **Mobile** (< 768px)
- 1 column grid
- Hero text size reduced
- Filter buttons stack
- Footer columns stack

### **Tablet** (768px - 1024px)
- 2 column grid
- Hero at full width
- Filter buttons inline
- Footer 2 columns

### **Desktop** (> 1024px)
- 3 column grid
- Hero at full width
- All elements optimal size
- Footer 4 columns

---

## 🎯 Component Hierarchy

```
HomePage (Client Component)
├── Header
│   ├── Logo / Brand Name
│   └── Cart Button (with count badge)
│
├── HeroSection
│   ├── Background Image
│   ├── Title + Description
│   ├── CTA Buttons
│   ├── Stats Row
│   └── Scroll Indicator
│
├── Menu Section
│   ├── Section Header
│   ├── Filter Tabs (All/Classic/Premium)
│   └── Products Grid
│       └── ProductCard (x28)
│           ├── Image
│           ├── Premium Badge (conditional)
│           ├── Name
│           ├── Description
│           ├── Price
│           └── Add Button
│
├── Footer
│   ├── Brand Column
│   ├── Quick Links Column
│   ├── Contact Column
│   ├── Social Column
│   └── Copyright
│
└── Cart Sidebar
    └── (Zustand state management)
```

---

## ✨ Interactive Elements

### **Header**
- **Cart Button:** Opens sidebar, shows item count
- **Hover:** Orange button darkens

### **Hero**
- **Order Now Button:** Smooth scrolls to #menu
- **View Menu Button:** Smooth scrolls to #menu
- **Scroll Indicator:** Continuous bounce animation

### **Filter Tabs**
- **Active State:** Orange background, white text, scale(1.05)
- **Inactive State:** White background, gray text
- **Hover:** Gray background

### **Product Cards**
- **Card Hover:** Shadow increases, border appears
- **Image Hover:** Zooms to 110%
- **Add Button Click:** Changes to "✓ Added" (green) for 800ms
- **Premium Badge:** Appears on pizzas €11+

### **Footer**
- **Social Icons:** Rotate 5° on hover, scale to 1.2
- **Links:** Gray → White on hover

---

## 🎨 Design Principles

### **Visual Hierarchy**
1. Hero grabs attention (large, animated)
2. Filter tabs guide selection
3. Products are prominent (large cards)
4. Footer provides utility (smaller)

### **Consistency**
- All buttons use same orange color
- Card shadows consistent
- Spacing follows 8px grid
- Typography scale consistent

### **Feedback**
- Hover states on all interactive elements
- Add to cart shows visual confirmation
- Cart count updates immediately
- Smooth transitions (300ms)

### **Accessibility**
- Focus states visible (2px outline)
- High contrast text
- Keyboard navigation works
- Screen reader friendly structure

---

## 📊 Typography Scale

```css
text-6xl:  60px  (Hero title)
text-5xl:  48px  (Section headings)
text-3xl:  30px  (Prices)
text-2xl:  24px  (Card titles)
text-xl:   20px  (Hero description)
text-base: 16px  (Body text)
text-sm:   14px  (Card descriptions)
```

### **Font Weights**
- Bold: Headings, prices, buttons (700)
- Semibold: Card titles (600)
- Regular: Body text (400)

---

## 🎭 User Flow

1. **Land on Page** → Hero animates in
2. **Read Hero** → Learn about PornoPizza
3. **Click "Order Now"** → Smooth scroll to menu
4. **See Menu** → All 28 pizzas displayed
5. **Filter (optional)** → Classic or Premium
6. **Browse** → Hover to see effects
7. **Select Pizza** → Click "Add"
8. **See Feedback** → Button shows "✓ Added"
9. **Check Cart** → Header shows count
10. **Open Cart** → Click cart button
11. **Checkout** → (existing flow)

---

## 🌟 Special Features

### **Premium Badge**
- Only appears on pizzas ≥ €11
- Red background (#EF4444)
- Top-right corner
- Small, unobtrusive

### **Staggered Animation**
- Cards appear one after another
- 50ms delay between each
- Creates flowing entrance
- Only on first view

### **Smooth Scroll**
```css
html { scroll-behavior: smooth; }
```
All anchor links scroll smoothly

### **Custom Scrollbar**
- 10px wide
- Orange thumb (matches brand)
- Rounded corners
- Darker on hover

---

## 🎉 Polish Details

### **Text Selection**
- Orange background
- White text
- Matches brand colors

### **Loading States**
- Skeleton screens
- Pulse animation
- Matches card layout
- Smooth transition to content

### **Empty States**
- 🍕 emoji
- "No pizzas found" message
- "Try a different filter" hint
- Fade in animation

### **Hover States**
- Cards: Shadow + scale
- Images: Zoom
- Buttons: Scale + color shift
- Links: Color change
- Social icons: Rotate + scale

---

**This design creates a cohesive, professional, and delightful pizza ordering experience!** 🍕✨

