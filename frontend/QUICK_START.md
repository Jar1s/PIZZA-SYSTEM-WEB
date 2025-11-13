# Quick Start - Frontend

Get the customer frontend running in 3 steps.

## 1️⃣ Install

```bash
cd frontend
npm install
```

## 2️⃣ Configure

```bash
cp .env.example .env.local
```

Default configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 3️⃣ Run

```bash
npm run dev
```

## 🎯 Test It

Visit: **http://localhost:3001?tenant=pornopizza**

You should see:
- Orange-themed website
- Product menu with categories
- "Add to Cart" buttons
- Cart icon in header

## ✅ Success!

If you see the menu, you're ready to:
- Add items to cart
- Proceed to checkout
- Test the full ordering flow

## 🆘 Backend Not Running?

If you see "Unable to load menu":

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📚 Full Documentation

- `SETUP.md` - Detailed setup instructions
- `README.md` - Project overview and features
- `AGENT-6-COMPLETE.md` - Implementation details













