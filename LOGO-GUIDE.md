# 🍕 PornoPizza Logo Guide

## 📦 Current Status

I've created a **simple SVG placeholder logo** for you at:
```
frontend/public/logo-pornopizza.svg
```

This is a basic text-based logo with a pizza theme. For production, you'll want a professional logo.

---

## 🎨 Professional Logo Creation Options

### **Option 1: AI Logo Generators (Quick & Cheap)**

#### **Free/Cheap Tools:**
1. **Canva** (https://canva.com)
   - Free tier available
   - Lots of pizza templates
   - Easy to use

2. **LogoMaker** (https://logomaker.com)
   - $20-40 one-time
   - Professional results

3. **Looka** (https://looka.com)
   - AI-powered
   - $20-65

#### **AI Image Generators:**
1. **DALL-E 3** (https://openai.com/dall-e-3)
   - ChatGPT Plus ($20/month)
   - Prompt: "Modern pizza restaurant logo for 'PornoPizza', bold typography, pizza slice graphic, orange and red colors, playful and fun style"

2. **Midjourney** (https://midjourney.com)
   - $10-30/month
   - High quality results
   - Prompt: "pizza restaurant logo, bold text 'PornoPizza', pizza slice icon, orange red color scheme, modern minimalist --v 6"

3. **Adobe Firefly** (https://firefly.adobe.com)
   - Free tier available
   - Professional quality

### **Option 2: Hire a Designer (Best Quality)**

#### **Freelance Platforms:**
1. **Fiverr** (https://fiverr.com)
   - $10-100
   - Fast turnaround (24-72 hours)
   - Search: "logo design"

2. **Upwork** (https://upwork.com)
   - $50-500
   - More professional
   - Ongoing relationship

3. **99designs** (https://99designs.com)
   - Logo contest format
   - $299-$1299
   - Multiple designers compete

#### **Local Designers:**
- Check Slovak design communities
- Facebook groups for designers in Bratislava
- Instagram: #slovakdesigner #bratislavadesigner

---

## 📝 Logo Design Brief

When commissioning a logo, provide this brief:

### **Project Details**
- **Company:** PornoPizza
- **Industry:** Pizza delivery / Restaurant
- **Location:** Bratislava, Slovakia
- **Target Audience:** Young adults 18-35, urban, modern
- **Vibe:** Fun, bold, slightly edgy, memorable

### **Design Requirements**

#### **Primary Elements:**
- Company name: "PornoPizza" (or "PORNO PIZZA")
- Pizza graphic element (slice, whole pizza, or abstract)
- Must work in orange (#FF6B00) as primary color

#### **Style:**
- Modern and bold
- Not too corporate, not too casual
- Memorable and distinctive
- Must look good on:
  - Website header (small)
  - Mobile app icon
  - Pizza boxes (large)
  - Social media profile pics

#### **Technical Specs:**
- Vector format (SVG, AI, or EPS)
- Transparent background version
- Color version + Black & White version
- Minimum size: 512x512px
- Ideal: Square format (1:1 ratio)

#### **Color Palette:**
- Primary: Orange (#FF6B00)
- Secondary: Black or dark red
- Accent: Gold/yellow for highlights
- Background: Transparent or white

#### **Typography:**
- Bold, readable font
- Modern but not too generic
- Should work at small sizes

---

## 🎯 AI Prompt Examples

### **For DALL-E / ChatGPT:**
```
Create a modern logo for a pizza restaurant called "PornoPizza". 
The design should be bold and playful with:
- The text "PORNO PIZZA" in a strong, readable font
- A stylized pizza slice or pizza icon
- Orange (#FF6B00) and red color scheme
- Modern, minimalist style
- Circular badge format
- Professional but fun aesthetic
Vector style, clean lines, suitable for a restaurant brand.
```

### **For Midjourney:**
```
pizza restaurant logo design, text "PornoPizza", 
modern bold typography, pizza slice icon element, 
orange red black color palette, circular badge style, 
clean vector graphic, professional branding, 
minimalist design --v 6 --ar 1:1
```

### **For Fiverr Brief:**
```
I need a logo for my pizza delivery business "PornoPizza" 
based in Bratislava, Slovakia.

Requirements:
- Company name in bold, modern font
- Pizza element (slice or whole)
- Orange (#FF6B00) as main color
- Circular or square format
- Must work at small sizes (website header)
- Vector format (SVG + PNG)
- Transparent background version
- Modern, bold, memorable style

Please provide:
- Full color version
- Black & white version
- Transparent background
- Multiple file formats (SVG, PNG, AI/EPS)
```

---

## 📁 Logo File Formats Needed

When you get your logo, you need these files:

### **Required Formats:**
1. **SVG** - Vector, scalable, for web
2. **PNG** - High resolution (2048x2048px), transparent background
3. **PNG** - Favicon size (512x512px)
4. **PNG** - Social media (1200x1200px)

### **Optional Formats:**
5. **AI or EPS** - Adobe Illustrator (for future edits)
6. **PDF** - Print version
7. **ICO** - Favicon format

---

## 🔧 How to Use Your Logo

### **Step 1: Add Logo Files**
Place your logo files in:
```
frontend/public/
  logo.svg          (main logo)
  logo.png          (fallback)
  favicon.ico       (browser tab icon)
  apple-touch-icon.png (iOS icon)
```

### **Step 2: Update Tenant Configuration**

Edit your tenant in the database to include logo:
```typescript
theme: {
  primaryColor: '#FF6B00',
  logo: '/logo.svg',
  favicon: '/favicon.ico'
}
```

### **Step 3: Logo Is Already Integrated!**

The Header component already supports logos:
```typescript
{tenant.theme.logo && (
  <Image
    src={tenant.theme.logo}
    alt={tenant.name}
    width={50}
    height={50}
  />
)}
```

---

## 🎨 Temporary Logo (Current)

The SVG I created is a simple placeholder:
- Orange circular badge
- "PORNO PIZZA" text
- Pizza slice graphic
- Basic but functional

**To use it now:**
```bash
# The logo is already at:
frontend/public/logo-pornopizza.svg

# To activate it, update tenant in database:
# theme.logo = '/logo-pornopizza.svg'
```

---

## 💡 Design Tips

### **What Makes a Good Pizza Logo:**
1. **Memorable** - Unique enough to stand out
2. **Scalable** - Looks good tiny or huge
3. **Versatile** - Works in color and B&W
4. **Relevant** - Clearly a pizza/food brand
5. **Professional** - Builds trust with customers

### **Avoid:**
- ❌ Overly complex designs (won't scale)
- ❌ Thin lines (hard to read at small sizes)
- ❌ Too many colors (expensive to print)
- ❌ Trendy fonts (will look dated quickly)
- ❌ Generic pizza clipart (not memorable)

### **Examples to Reference:**
- Domino's - Simple, bold, iconic
- Pizza Hut - Red roof shape, memorable
- Papa John's - Clean typography
- MOD Pizza - Modern, minimal

---

## 🚀 Quick Action Plan

### **Budget Option (Free - $50):**
1. Use Canva or Looka
2. Pick a template
3. Customize with your colors
4. Download SVG + PNG
5. Upload to your site
**Time: 1-2 hours**

### **AI Option ($20-30):**
1. Subscribe to ChatGPT Plus or Midjourney
2. Use the prompts above
3. Generate 10-20 variations
4. Pick the best one
5. Refine and download
**Time: 2-4 hours**

### **Professional Option ($50-300):**
1. Post job on Fiverr
2. Provide the brief above
3. Review designs
4. Request revisions
5. Get final files
**Time: 2-7 days**

---

## 📱 Social Media Assets

Once you have a logo, create these:

### **Profile Pictures:**
- Facebook: 180x180px (displays at 170x170px)
- Instagram: 320x320px (displays at 110x110px)
- Twitter: 400x400px (displays at 200x200px)

### **Cover Images:**
- Facebook: 820x312px
- Twitter: 1500x500px

### **Posts:**
- Instagram: 1080x1080px (square)
- Instagram Stories: 1080x1920px
- Facebook: 1200x630px

---

## ✅ Checklist

When you receive your logo:
- [ ] SVG format included
- [ ] PNG with transparent background
- [ ] Works at small sizes (50x50px)
- [ ] Works in black & white
- [ ] Includes font files (if custom font)
- [ ] Editable source files (AI/EPS)
- [ ] Commercial license/rights included

---

## 🎉 Current Setup

Your placeholder logo is ready to use! To see it on the site:

1. I'll update the tenant configuration
2. Hard refresh your browser
3. Logo will appear in the header

For a professional logo, I recommend:
- **Quick:** Canva (1-2 hours, free-$20)
- **Quality:** Fiverr designer (2-3 days, $30-100)
- **Best:** Local Slovak designer (1-2 weeks, $100-500)

---

**Want me to activate the temporary logo on your site now?** 🍕

