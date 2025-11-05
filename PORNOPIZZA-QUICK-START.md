# 🍕 PornoPizza Quick Start Guide

## 🚀 Start Everything (Fresh)

### **Terminal 1: Backend**
```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro /backend"
npm run start:dev
```

### **Terminal 2: Frontend**  
```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro /frontend"
npm run dev
```

### **Browser**
```
http://pornopizza.localhost:3001
```

---

## 🎯 What You Should See

### **Hero Section**
- Large pizza background image (Margherita)
- "Welcome to PornoPizza" in orange
- Two buttons: "Order Now 🍕" and "View Menu"
- Stats: 30 Minutes delivery, 28+ Pizzas, 4.8/5 rating
- Bouncing scroll indicator at bottom

### **Menu Section**
- "Our Pizza Menu" heading in orange
- Three filter buttons: All Pizzas (28) | Classic | Premium
- Grid of 28 pizza cards with photos
- Each card shows:
  - Pizza photo (zooms on hover)
  - Pizza name
  - Description
  - Price in euros
  - "🛒 Add" button

### **Footer**
- Dark background with 4 columns
- Brand, Quick Links, Contact, Social
- Animated emoji icons for social media
- Copyright notice

---

## 🧪 Quick Test Checklist

1. **Hero Animation**
   - Page loads → hero content slides in from left ✓
   - Scroll indicator bounces ✓

2. **Menu Filtering**
   - Click "Classic" → see 13 pizzas ✓
   - Click "Premium" → see 15 pizzas ✓
   - Click "All Pizzas" → see 28 pizzas ✓

3. **Product Cards**
   - Hover over card → shadow increases ✓
   - Hover over image → zooms slightly ✓
   - Premium pizzas show red "Premium" badge ✓

4. **Add to Cart**
   - Click "🛒 Add" → button changes to "✓ Added" ✓
   - Cart count in header increases ✓
   - Click cart icon → sidebar opens ✓

5. **Smooth Scroll**
   - Click "Order Now" button → smoothly scrolls to menu ✓

6. **Responsive**
   - Resize browser → layout adapts ✓
   - Mobile: 1 column ✓
   - Tablet: 2 columns ✓
   - Desktop: 3 columns ✓

---

## 📊 Database Check

### **Verify Pizzas Were Seeded**
```bash
cd backend
npx prisma studio
```

Then:
1. Click "Product" table
2. Filter by `tenantId` = PornoPizza
3. Should see **28 products**
4. Check that `isActive` = true for all

---

## 🎨 Design Features to Notice

### **Animations**
- Product cards fade in with stagger effect (50ms delay)
- Hero section animates on load
- Scroll indicator bounces continuously
- Social icons rotate on hover
- Images zoom on hover

### **Polish**
- Custom orange scrollbar
- Text selection is orange
- Smooth transitions everywhere
- Focus states on all buttons
- Accessibility improvements

---

## 🐛 Troubleshooting

### **Images Not Showing?**
```bash
cd frontend
rm -rf .next
npm run dev
```

### **Wrong Pizzas Showing?**
Make sure you're at:
```
http://pornopizza.localhost:3001
```

NOT:
```
http://pizzavnudzi.localhost:3001
```

### **Database Empty?**
Re-run seed:
```bash
cd backend
npx ts-node -r tsconfig-paths/register prisma/seed-pornopizza-menu.ts
```

### **Cart Not Working?**
Clear localStorage:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

---

## 📸 Screenshot Checklist

Take screenshots of:
1. [ ] Hero section (full width)
2. [ ] Menu with all 28 pizzas
3. [ ] Menu with "Classic" filter
4. [ ] Menu with "Premium" filter
5. [ ] Product card hover effect
6. [ ] Cart with items
7. [ ] Footer section
8. [ ] Mobile view (responsive)

---

## 🎯 Expected Results

### **Performance**
- Page loads in < 2 seconds
- Animations are smooth (60fps)
- No console errors

### **Functionality**
- All images load correctly
- Filtering works perfectly
- Cart updates properly
- Smooth scrolling works

### **Design**
- Professional appearance
- Consistent branding (orange theme)
- Good spacing and typography
- Mobile responsive

---

## 🎉 Success!

If you see all the above features working correctly, then **PornoPizza is ready to go!** 🚀

The design transformation is complete with:
- ✅ 28 real pizza photos
- ✅ Beautiful hero section
- ✅ Smooth animations
- ✅ Filter functionality
- ✅ Professional design
- ✅ Mobile responsive

---

**Enjoy your stunning pizza ordering platform!** 🍕✨

