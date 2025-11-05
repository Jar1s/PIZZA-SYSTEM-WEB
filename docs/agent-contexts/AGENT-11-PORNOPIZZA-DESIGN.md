# 🎯 AGENT 11: PORNOPIZZA FRONTEND DESIGN & POLISH + MEDIA SETUP

## 📋 MISSION
Transform PornoPizza's frontend into a stunning, professional pizza ordering experience with real product images, engaging animations, and polished UI/UX. You have 30 high-quality pizza photos ready to use!

---

## 🎨 CONTEXT

### **Project Overview**
- **Multi-tenant pizza platform** (Next.js 14 + NestJS + PostgreSQL)
- **Your tenant:** PornoPizza (`pornopizza.localhost:3001`)
- **Sister site:** PizzaVNudzi (shares codebase)
- **Backend:** Already working (orders, cart, checkout)
- **Current state:** Functional but basic design
- **Your goal:** Make it GORGEOUS 🚀

### **What You're Building**
1. **Complete menu with 30 real pizzas** (photos provided by user)
2. **Hero section** with eye-catching design
3. **Improved product cards** with hover effects
4. **Professional footer** with social links
5. **Loading states & animations** (Framer Motion)
6. **Mobile-responsive** design
7. **Polished typography & spacing**

---

## 📸 YOUR MEDIA ASSETS (READY TO USE!)

### **Location of Pizza Photos**
```
/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/
```

### **What's Available:**
- ✅ **15 pizzas** in main folder (Classic line)
- ✅ **15 pizzas** in `top 15/` subfolder (Premium line)
- ✅ **Total: 30 pizzas** with names in filenames
- ✅ **High-quality JPG photos** ready to use

### **Photo Organization**

#### **📁 CLASSIC PIZZAS** (Main folder)
1. `BBQ Chicken.jpg`
2. `Boscaiola.jpg`
3. `Capricciosa.jpg`
4. `Diavola.jpg`
5. `Funghi.jpg`
6. `Hawaii.jpg`
7. `Margherita.jpg`
8. `Napoletana.jpg`
9. `Parma.jpg`
10. `Pepperoni.jpg`
11. `Primavera.jpg`
12. `Prosciutto.jpg`
13. `Quattro Formaggi.jpg`
14. `Siciliana.jpg`
15. `Tonno.jpg`

#### **📁 PREMIUM PIZZAS** (`top 15/` subfolder)
1. `4 SEASONS.jpg`
2. `AL CARNE.jpg`
3. `BUFFALO.jpg`
4. `CARBONARA.jpg`
5. `CLASSICO.jpg`
6. `CHICKEN BACON.jpg`
7. `FUNGHI TARTUFO.jpg`
8. `GAMBERI.jpg`
9. `HAWAII DE LUX.jpg`
10. `MEXICANA.jpg`
11. `OKTOBERFEST.jpg`
12. `RUSTICA.jpg`
13. `SALAMI PEPPERONI.jpg`
14. `TASTY.jpg`
15. `VEGETARIANA.jpg`

---

## 🚀 STEP-BY-STEP IMPLEMENTATION

### **PHASE 1: Setup Media Assets** 📸

#### **1.1 Create Image Directory Structure**
```bash
mkdir -p frontend/public/images/pizzas/classic
mkdir -p frontend/public/images/pizzas/premium
mkdir -p frontend/public/images/sides
mkdir -p frontend/public/images/drinks
mkdir -p frontend/public/images/desserts
mkdir -p frontend/public/images/hero
```

#### **1.2 Copy Pizza Photos**
```bash
# Copy classic pizzas (15 photos)
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/BBQ Chicken.jpg" "frontend/public/images/pizzas/classic/bbq-chicken.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Boscaiola.jpg" "frontend/public/images/pizzas/classic/boscaiola.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Capricciosa.jpg" "frontend/public/images/pizzas/classic/capricciosa.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Diavola.jpg" "frontend/public/images/pizzas/classic/diavola.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Funghi.jpg" "frontend/public/images/pizzas/classic/funghi.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Hawaii.jpg" "frontend/public/images/pizzas/classic/hawaii.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Margherita.jpg" "frontend/public/images/pizzas/classic/margherita.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Napoletana.jpg" "frontend/public/images/pizzas/classic/napoletana.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Parma.jpg" "frontend/public/images/pizzas/classic/parma.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Pepperoni.jpg" "frontend/public/images/pizzas/classic/pepperoni.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Primavera.jpg" "frontend/public/images/pizzas/classic/primavera.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Prosciutto.jpg" "frontend/public/images/pizzas/classic/prosciutto.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Quattro Formaggi.jpg" "frontend/public/images/pizzas/classic/quattro-formaggi.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Siciliana.jpg" "frontend/public/images/pizzas/classic/siciliana.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/Tonno.jpg" "frontend/public/images/pizzas/classic/tonno.jpg"

# Copy premium pizzas (15 photos from top 15 subfolder)
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/4 SEASONS.jpg" "frontend/public/images/pizzas/premium/quattro-stagioni.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/AL CARNE.jpg" "frontend/public/images/pizzas/premium/al-carne.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/BUFFALO.jpg" "frontend/public/images/pizzas/premium/buffalo.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/CARBONARA.jpg" "frontend/public/images/pizzas/premium/carbonara.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/CLASSICO.jpg" "frontend/public/images/pizzas/premium/classico.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/CHICKEN BACON.jpg" "frontend/public/images/pizzas/premium/chicken-bacon.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/FUNGHI TARTUFO.jpg" "frontend/public/images/pizzas/premium/funghi-tartufo.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/GAMBERI.jpg" "frontend/public/images/pizzas/premium/gamberi.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/HAWAII DE LUX.jpg" "frontend/public/images/pizzas/premium/hawaii-deluxe.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/MEXICANA.jpg" "frontend/public/images/pizzas/premium/mexicana.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/OKTOBERFEST.jpg" "frontend/public/images/pizzas/premium/oktoberfest.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/RUSTICA.jpg" "frontend/public/images/pizzas/premium/rustica.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/SALAMI PEPPERONI.jpg" "frontend/public/images/pizzas/premium/salami-pepperoni.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/TASTY.jpg" "frontend/public/images/pizzas/premium/tasty.jpg"
cp "/Users/jaroslav/Documents/CODING/WEBY miro /pizza photos/MAYDAY PIZZE NOVE/top 15/VEGETARIANA.jpg" "frontend/public/images/pizzas/premium/vegetariana.jpg"
```

#### **1.3 Optimize Images (Optional but Recommended)**
```bash
# Install image optimization tool
brew install imagemagick  # macOS
# or
sudo apt install imagemagick  # Linux

# Optimize all images to ~200KB for web
find frontend/public/images/pizzas -name "*.jpg" -exec mogrify -resize 800x800\> -quality 85 {} \;
```

---

### **PHASE 2: Update Database with All Pizzas** 🍕

#### **2.1 Create New Seed File: `backend/prisma/seed-pornopizza-menu.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPornoPizzaMenu() {
  console.log('🍕 Seeding PornoPizza menu with 30 pizzas...');

  // Find PornoPizza tenant
  const pornopizza = await prisma.tenant.findUnique({
    where: { subdomain: 'pornopizza' },
  });

  if (!pornopizza) {
    throw new Error('PornoPizza tenant not found. Run main seed first.');
  }

  // Delete existing products for clean slate
  await prisma.product.deleteMany({
    where: { tenantId: pornopizza.id },
  });

  // CLASSIC PIZZAS (€8.90 - €10.90)
  const classicPizzas = [
    {
      name: 'Margherita',
      description: 'Classic tomato sauce, mozzarella, fresh basil, olive oil',
      priceCents: 790,
      imageUrl: '/images/pizzas/classic/margherita.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Pepperoni',
      description: 'Spicy pepperoni, mozzarella, tomato sauce',
      priceCents: 890,
      imageUrl: '/images/pizzas/classic/pepperoni.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Funghi',
      description: 'Mushrooms, mozzarella, tomato sauce, oregano',
      priceCents: 850,
      imageUrl: '/images/pizzas/classic/funghi.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Hawaii',
      description: 'Ham, pineapple, mozzarella, tomato sauce',
      priceCents: 890,
      imageUrl: '/images/pizzas/classic/hawaii.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Prosciutto',
      description: 'Italian ham, mozzarella, tomato sauce, arugula',
      priceCents: 990,
      imageUrl: '/images/pizzas/classic/prosciutto.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Quattro Formaggi',
      description: 'Mozzarella, gorgonzola, parmesan, goat cheese',
      priceCents: 1090,
      imageUrl: '/images/pizzas/classic/quattro-formaggi.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Diavola',
      description: 'Spicy salami, hot peppers, mozzarella, tomato sauce',
      priceCents: 950,
      imageUrl: '/images/pizzas/classic/diavola.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Capricciosa',
      description: 'Ham, mushrooms, artichokes, olives, mozzarella',
      priceCents: 1050,
      imageUrl: '/images/pizzas/classic/capricciosa.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Tonno',
      description: 'Tuna, red onions, capers, mozzarella, tomato sauce',
      priceCents: 950,
      imageUrl: '/images/pizzas/classic/tonno.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Napoletana',
      description: 'Anchovies, capers, olives, mozzarella, tomato sauce',
      priceCents: 920,
      imageUrl: '/images/pizzas/classic/napoletana.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Primavera',
      description: 'Fresh vegetables, cherry tomatoes, mozzarella, pesto',
      priceCents: 880,
      imageUrl: '/images/pizzas/classic/primavera.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Boscaiola',
      description: 'Mushrooms, sausage, mozzarella, cream sauce',
      priceCents: 1020,
      imageUrl: '/images/pizzas/classic/boscaiola.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Siciliana',
      description: 'Eggplant, cherry tomatoes, ricotta, mozzarella, basil',
      priceCents: 980,
      imageUrl: '/images/pizzas/classic/siciliana.jpg',
      category: 'PIZZA',
    },
    {
      name: 'BBQ Chicken',
      description: 'Grilled chicken, BBQ sauce, red onions, mozzarella',
      priceCents: 1050,
      imageUrl: '/images/pizzas/classic/bbq-chicken.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Parma',
      description: 'Prosciutto di Parma, arugula, parmesan, mozzarella',
      priceCents: 1190,
      imageUrl: '/images/pizzas/classic/parma.jpg',
      category: 'PIZZA',
    },
  ];

  // PREMIUM PIZZAS (€11.90 - €14.90)
  const premiumPizzas = [
    {
      name: 'Quattro Stagioni',
      description: 'Four seasons: ham, mushrooms, artichokes, olives in quarters',
      priceCents: 1290,
      imageUrl: '/images/pizzas/premium/quattro-stagioni.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Al Carne',
      description: 'Mixed meats: beef, sausage, bacon, ham, mozzarella',
      priceCents: 1390,
      imageUrl: '/images/pizzas/premium/al-carne.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Buffalo',
      description: 'Buffalo mozzarella, cherry tomatoes, fresh basil, balsamic glaze',
      priceCents: 1290,
      imageUrl: '/images/pizzas/premium/buffalo.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Carbonara',
      description: 'Cream sauce, bacon, egg yolk, parmesan, black pepper',
      priceCents: 1190,
      imageUrl: '/images/pizzas/premium/carbonara.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Classico Premium',
      description: 'San Marzano tomatoes, buffalo mozzarella, prosciutto, arugula',
      priceCents: 1390,
      imageUrl: '/images/pizzas/premium/classico.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Chicken Bacon',
      description: 'Grilled chicken, crispy bacon, ranch sauce, mozzarella',
      priceCents: 1290,
      imageUrl: '/images/pizzas/premium/chicken-bacon.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Funghi Tartufo',
      description: 'Mixed mushrooms, truffle oil, parmesan, mozzarella, cream',
      priceCents: 1490,
      imageUrl: '/images/pizzas/premium/funghi-tartufo.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Gamberi',
      description: 'Tiger prawns, garlic, cherry tomatoes, arugula, lemon zest',
      priceCents: 1490,
      imageUrl: '/images/pizzas/premium/gamberi.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Hawaii Deluxe',
      description: 'Smoked ham, caramelized pineapple, jalapeños, mozzarella',
      priceCents: 1190,
      imageUrl: '/images/pizzas/premium/hawaii-deluxe.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Mexicana',
      description: 'Spicy beef, jalapeños, beans, corn, cheddar, salsa',
      priceCents: 1290,
      imageUrl: '/images/pizzas/premium/mexicana.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Oktoberfest',
      description: 'German sausage, sauerkraut, mustard sauce, onions, mozzarella',
      priceCents: 1290,
      imageUrl: '/images/pizzas/premium/oktoberfest.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Rustica',
      description: 'Roasted vegetables, goat cheese, honey, walnuts, arugula',
      priceCents: 1290,
      imageUrl: '/images/pizzas/premium/rustica.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Salami Pepperoni Deluxe',
      description: 'Double salami, double pepperoni, hot peppers, mozzarella',
      priceCents: 1390,
      imageUrl: '/images/pizzas/premium/salami-pepperoni.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Tasty Special',
      description: 'Chef\'s secret mix: meats, vegetables, special sauce, herbs',
      priceCents: 1390,
      imageUrl: '/images/pizzas/premium/tasty.jpg',
      category: 'PIZZA',
    },
    {
      name: 'Vegetariana Premium',
      description: 'Grilled vegetables, sun-dried tomatoes, feta, olives, pesto',
      priceCents: 1190,
      imageUrl: '/images/pizzas/premium/vegetariana.jpg',
      category: 'PIZZA',
    },
  ];

  // Insert all pizzas
  const allPizzas = [...classicPizzas, ...premiumPizzas];
  
  for (const pizza of allPizzas) {
    await prisma.product.create({
      data: {
        ...pizza,
        tenantId: pornopizza.id,
        available: true,
      },
    });
    console.log(`✅ Created: ${pizza.name}`);
  }

  console.log(`\n🎉 Successfully seeded ${allPizzas.length} pizzas for PornoPizza!`);
}

seedPornoPizzaMenu()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### **2.2 Run the Seed**
```bash
cd backend
npx ts-node -r tsconfig-paths/register prisma/seed-pornopizza-menu.ts
```

---

### **PHASE 3: Frontend UI Components** 🎨

#### **3.1 Hero Section Component**

**Create:** `frontend/components/home/HeroSection.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface HeroSectionProps {
  tenantName: string;
  primaryColor: string;
}

export const HeroSection = ({ tenantName, primaryColor }: HeroSectionProps) => {
  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/pizza-hero.jpg"
          alt="Delicious pizza"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl text-white"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-6xl font-bold mb-6 leading-tight"
          >
            Welcome to <span style={{ color: primaryColor }}>{tenantName}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl mb-8 text-gray-200"
          >
            Authentic Italian pizza delivered hot to your door. 
            Choose from 30 delicious varieties made with love.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex gap-4"
          >
            <button
              onClick={() => {
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-lg font-bold text-lg transition-transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: primaryColor, color: 'white' }}
            >
              Order Now 🍕
            </button>
            <button
              className="px-8 py-4 rounded-lg font-bold text-lg bg-white/20 backdrop-blur-sm border-2 border-white hover:bg-white/30 transition-all"
            >
              View Menu
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12 flex gap-8 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-3xl">🕐</span>
              <div>
                <div className="font-bold">30 Minutes</div>
                <div className="text-gray-300">Delivery Time</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍕</span>
              <div>
                <div className="font-bold">30 Pizzas</div>
                <div className="text-gray-300">To Choose From</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="font-bold">4.8/5</div>
                <div className="text-gray-300">Customer Rating</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="text-white text-center">
          <div className="text-sm mb-2">Scroll to explore</div>
          <div className="text-2xl">↓</div>
        </div>
      </motion.div>
    </section>
  );
};
```

#### **3.2 Improved Product Card**

**Update:** `frontend/components/menu/ProductCard.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Product } from '@/shared';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = ({ product, index }: ProductCardProps) => {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem(product, 1, []);
    
    // Visual feedback
    setTimeout(() => {
      setIsAdding(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <Image
          src={product.imageUrl || '/images/placeholder-pizza.jpg'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        
        {/* "New" Badge (for premium pizzas) */}
        {product.priceCents > 1100 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            Premium
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-primary">
            €{(product.priceCents / 100).toFixed(2)}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
              isAdding 
                ? 'bg-green-500' 
                : 'bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg'
            }`}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                ✓ Added
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🛒 Add
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 border-4 border-transparent group-hover:border-primary rounded-2xl transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};
```

#### **3.3 Footer Component**

**Create:** `frontend/components/layout/Footer.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';

interface FooterProps {
  tenantName: string;
  primaryColor: string;
}

export const Footer = ({ tenantName, primaryColor }: FooterProps) => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
              {tenantName}
            </h3>
            <p className="text-gray-400">
              Authentic Italian pizza delivered hot to your door.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/#menu" className="hover:text-white transition">Menu</a></li>
              <li><a href="/cart" className="hover:text-white transition">Cart</a></li>
              <li><a href="/checkout" className="hover:text-white transition">Checkout</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>📍 Bratislava, Slovakia</li>
              <li>📞 +421 123 456 789</li>
              <li>✉️ info@{tenantName.toLowerCase()}.sk</li>
              <li>🕐 Daily 11:00 - 23:00</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-bold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <motion.a
                whileHover={{ scale: 1.2, rotate: 5 }}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition"
              >
                📘
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, rotate: -5 }}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition"
              >
                📷
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, rotate: 5 }}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition"
              >
                🐦
              </motion.a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} {tenantName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
```

#### **3.4 Loading Skeleton**

**Create:** `frontend/components/menu/ProductSkeleton.tsx`

```typescript
'use client';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-64 bg-gray-300" />
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-300 rounded mb-3 w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
        <div className="h-4 bg-gray-200 rounded mb-4 w-5/6" />
        
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-300 rounded w-20" />
          <div className="h-10 bg-gray-300 rounded w-24" />
        </div>
      </div>
    </div>
  );
};
```

---

### **PHASE 4: Update Homepage** 🏠

**Update:** `frontend/app/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getProducts, getTenant } from '@/lib/api';
import { Product, Tenant } from '@/shared';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductSkeleton } from '@/components/menu/ProductSkeleton';
import { HeroSection } from '@/components/home/HeroSection';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'classic' | 'premium'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, tenantData] = await Promise.all([
          getProducts(),
          getTenant(),
        ]);
        setProducts(productsData);
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    if (filter === 'classic') return product.priceCents < 1100;
    if (filter === 'premium') return product.priceCents >= 1100;
    return true;
  });

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-[600px] bg-gray-300 animate-pulse" />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection 
        tenantName={tenant.name} 
        primaryColor={tenant.theme.primaryColor} 
      />

      {/* Menu Section */}
      <section id="menu" className="container mx-auto px-4 py-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold mb-4" style={{ color: tenant.theme.primaryColor }}>
            Our Pizza Menu
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from 30 handcrafted pizzas, each made with fresh ingredients and authentic Italian recipes.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center gap-4 mb-12"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              filter === 'all'
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={filter === 'all' ? { backgroundColor: tenant.theme.primaryColor } : {}}
          >
            All Pizzas ({products.length})
          </button>
          <button
            onClick={() => setFilter('classic')}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              filter === 'classic'
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={filter === 'classic' ? { backgroundColor: tenant.theme.primaryColor } : {}}
          >
            Classic (€7.90 - €10.90)
          </button>
          <button
            onClick={() => setFilter('premium')}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${
              filter === 'premium'
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={filter === 'premium' ? { backgroundColor: tenant.theme.primaryColor } : {}}
          >
            Premium (€11.90 - €14.90)
          </button>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🍕</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No pizzas found</h3>
            <p className="text-gray-500">Try a different filter</p>
          </motion.div>
        )}
      </section>

      {/* Footer */}
      <Footer tenantName={tenant.name} primaryColor={tenant.theme.primaryColor} />
    </div>
  );
}
```

---

### **PHASE 5: Polish & Styling** ✨

#### **5.1 Update Global Styles**

**Update:** `frontend/app/globals.css`

Add these styles:

```css
/* Smooth Scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom Colors (Dynamic via CSS Variables) */
:root {
  --color-primary: #e74c3c;
  --color-primary-dark: #c0392b;
  --color-secondary: #2c3e50;
}

/* Text Selection */
::selection {
  background-color: var(--color-primary);
  color: white;
}

/* Improved Line Clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out;
}

/* Improved Button Styles */
button {
  cursor: pointer;
  transition: all 0.3s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Image Loading Blur Effect */
.image-blur-up {
  filter: blur(10px);
  transition: filter 0.3s ease;
}

.image-loaded {
  filter: blur(0);
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-dark);
}
```

#### **5.2 Update Layout to Include Footer**

**Update:** `frontend/app/layout.tsx`

Ensure the layout includes the Header but NOT the Footer (footer is per-page):

```typescript
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { CartProvider } from '@/hooks/useCart';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Header />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
```

---

### **PHASE 6: Hero Image & Missing Assets** 🖼️

#### **6.1 Hero Image**
You need a hero image. Options:
1. **Use one of the pizza photos** as background
2. **Download free stock photo** from:
   - https://unsplash.com/s/photos/pizza
   - https://pexels.com/search/pizza/

Save as: `frontend/public/images/hero/pizza-hero.jpg`

#### **6.2 Placeholder Image**
Create a simple placeholder for products without images:

Save as: `frontend/public/images/placeholder-pizza.jpg`

Or use a free stock photo from Unsplash.

#### **6.3 Missing Product Categories**
If you add sides/drinks/desserts later, use stock photos:
- **Sides:** garlic bread, chicken wings, salad
- **Drinks:** Coca-Cola, Fanta, water bottles
- **Desserts:** tiramisu, panna cotta, ice cream

---

### **PHASE 7: Testing & Final Touches** 🧪

#### **7.1 Test Checklist**

```bash
# 1. Start backend
cd backend
npx ts-node -r tsconfig-paths/register src/main.ts

# 2. Start frontend
cd frontend
npm run dev

# 3. Open browser
# - http://pornopizza.localhost:3001
# - Test all features:
```

**Test Items:**
- [ ] Hero section displays correctly
- [ ] All 30 pizzas load with images
- [ ] Filter tabs work (All/Classic/Premium)
- [ ] Product cards hover effects work
- [ ] Add to cart animation works
- [ ] Footer displays correctly
- [ ] Mobile responsive (test on phone/tablet)
- [ ] Page scrolls smoothly
- [ ] Images load quickly
- [ ] No console errors

#### **7.2 Multi-Tenant Test**

**Important:** Test that PizzaVNudzi still works!

```bash
# Visit both sites:
# - http://pornopizza.localhost:3001
# - http://pizzavnudzi.localhost:3001

# Ensure both:
# - Load their own products
# - Show their own theme colors
# - Work independently
```

---

## 🎯 SUCCESS CRITERIA

### **You're Done When:**

✅ **All 30 pizzas display** with real photos  
✅ **Hero section** is eye-catching and professional  
✅ **Product cards** have smooth hover effects  
✅ **Filtering works** (All/Classic/Premium)  
✅ **Footer** is complete with links and social  
✅ **Mobile responsive** (test on small screens)  
✅ **Animations smooth** (Framer Motion working)  
✅ **No console errors** in browser  
✅ **PizzaVNudzi still works** (multi-tenant intact)  
✅ **Page loads fast** (< 2 seconds)  
✅ **Professional design** that impresses  

---

## 📚 REFERENCE FILES

### **Files You'll Edit:**
1. `frontend/app/page.tsx` - Homepage
2. `frontend/components/menu/ProductCard.tsx` - Product display
3. `frontend/components/home/HeroSection.tsx` - NEW
4. `frontend/components/layout/Footer.tsx` - NEW
5. `frontend/components/menu/ProductSkeleton.tsx` - NEW
6. `frontend/app/globals.css` - Styling
7. `backend/prisma/seed-pornopizza-menu.ts` - NEW

### **Files You'll Create:**
- 30 pizza images in `frontend/public/images/pizzas/`
- 1 hero image in `frontend/public/images/hero/`
- New components (Hero, Footer, Skeleton)

### **Don't Touch:**
- `backend/src/` - Backend logic (already working)
- `shared/` - TypeScript types (already working)
- Other tenant data (keep PizzaVNudzi intact)

---

## 🚀 GET STARTED

### **Quick Start Commands:**

```bash
# 1. Copy all pizza images
# (Use the commands from PHASE 1.2 above)

# 2. Seed database with 30 pizzas
cd backend
npx ts-node -r tsconfig-paths/register prisma/seed-pornopizza-menu.ts

# 3. Start development
cd frontend
npm run dev

# 4. Visit site
open http://pornopizza.localhost:3001
```

---

## 💡 TIPS & TRICKS

### **Design Philosophy:**
- **Keep it simple:** Don't over-design
- **Use whitespace:** Let content breathe
- **Consistent spacing:** Use 8px, 16px, 24px, 32px
- **Bold typography:** Make text easy to read
- **High contrast:** Ensure accessibility

### **Performance:**
- Optimize images to ~200KB each
- Use Next.js Image component (automatic optimization)
- Lazy load images below the fold
- Use Framer Motion sparingly (only on key elements)

### **Multi-Tenant:**
- Always use `tenant.theme.primaryColor` for colors
- Don't hardcode tenant names
- Test both sites after changes

---

## 🆘 TROUBLESHOOTING

### **Images Not Loading?**
```bash
# Check image paths
ls frontend/public/images/pizzas/classic/
ls frontend/public/images/pizzas/premium/

# Restart Next.js dev server
cd frontend
rm -rf .next
npm run dev
```

### **Seed Script Fails?**
```bash
# Ensure PornoPizza tenant exists
cd backend
npx prisma studio
# Check "Tenant" table for pornopizza
```

### **Styling Not Applying?**
```bash
# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Check CSS variables in DevTools
# Should see --color-primary defined
```

---

## 📖 ADDITIONAL RESOURCES

- **Framer Motion Docs:** https://www.framer.com/motion/
- **Next.js Image Docs:** https://nextjs.org/docs/app/building-your-application/optimizing/images
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Free Pizza Images:** https://unsplash.com/s/photos/pizza

---

**Ready to go!** 🎨🍕🚀

**Your mission:** Transform PornoPizza into the most beautiful pizza ordering site in Slovakia!

**Time estimate:** 4-6 hours for complete implementation.

**Have fun building! If you get stuck, re-read this document or ask for help.** 😊

