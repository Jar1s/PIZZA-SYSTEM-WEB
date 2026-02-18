# 🚀 Self-Serve Multi-Brand Execution Engine — Vision & Architecture

## Executive Summary

**Current State**: Multi-tenant pizza ordering platform with admin-managed brands  
**Vision**: Self-serve platform where businesses create, test, and scale multiple brands without DevOps

**Core Principle**: *"If the client needs the founder, it's not a product."*

---

## 🎯 Vision Breakdown

### What You're Building

A **horizontal execution engine** that allows businesses to:
1. **Sign up** → Create business account
2. **Create brand** → Choose template → Customize → Publish
3. **Scale** → Launch multiple brands on one backend
4. **Analyze** → Compare performance across brands
5. **Optimize** → AI-powered insights and recommendations

### Key Differentiators

- **No DevOps**: Everything self-serve
- **Template System**: Fast/Cheap, Bold/Viral, Clean/Premium, Dark/Night
- **Controlled Customization**: Guardrails prevent breaking changes
- **Multi-Brand Analytics**: Cross-brand performance comparison
- **AI Roadmap**: Brand Generator → Performance Insights → Autonomous Optimization

---

## 📊 Current Architecture Analysis

### ✅ What You Already Have

#### 1. **Multi-Tenant Foundation** (Strong)
- ✅ Tenant isolation via `tenantId` on all tables
- ✅ Domain/subdomain routing (`domain`, `subdomain` fields)
- ✅ Theme customization (JSON `theme` field)
- ✅ Tenant cloning (`cloneTenant()` method)
- ✅ Sync from master (`syncFromMaster()` method)

#### 2. **Backend Infrastructure** (Solid)
- ✅ NestJS API with Prisma ORM
- ✅ PostgreSQL database with proper indexes
- ✅ JWT authentication
- ✅ Role-based access (ADMIN, OPERATOR, CUSTOMER)
- ✅ Multi-tenant API endpoints

#### 3. **Frontend Runtime** (Good)
- ✅ Next.js 14 with App Router
- ✅ Dynamic tenant resolution (middleware)
- ✅ Admin dashboard
- ✅ Brand management UI

#### 4. **Configuration System** (Flexible)
- ✅ JSON configs: `theme`, `paymentConfig`, `deliveryConfig`, `emailConfig`
- ✅ Tenant-specific overrides
- ✅ Shared products with tenant overrides

### ❌ What's Missing for Self-Serve

#### 1. **User → Business → Brand Hierarchy**
```
Current: User → Tenant (direct)
Needed:  User → Business → Brand (hierarchical)
```

**Gap**: No `Business` entity. Users can't own multiple brands.

#### 2. **Self-Serve Onboarding**
- ❌ No sign-up flow
- ❌ No business creation wizard
- ❌ No brand creation wizard
- ❌ No template selection

#### 3. **Template System**
- ❌ No template definitions
- ❌ No template application logic
- ❌ No template marketplace

#### 4. **Visual Editor**
- ❌ No drag-and-drop editor
- ❌ No controlled customization UI
- ❌ No preview system

#### 5. **Billing & Limits**
- ❌ No subscription plans
- ❌ No brand limits per plan
- ❌ No usage tracking
- ❌ No payment processing for subscriptions

#### 6. **Analytics & Insights**
- ❌ No cross-brand analytics
- ❌ No performance comparison
- ❌ No AI insights

#### 7. **Domain Management**
- ❌ No subdomain provisioning (v1)
- ❌ No custom domain setup (v2)
- ❌ No DNS management

---

## 🏗️ Architecture Evolution Plan

### Phase 1: Foundation (Weeks 1-4)

#### 1.1 Database Schema Extensions

```prisma
// Add Business entity
model Business {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  ownerId     String   // User who owns the business
  plan        PlanType @default(FREE)
  brandLimit  Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  owner       User     @relation(fields: [ownerId], references: [id])
  brands      Brand[]  // Rename Tenant → Brand
  subscriptions Subscription[]
  
  @@index([ownerId])
  @@map("businesses")
}

// Rename Tenant → Brand (or keep Tenant, add businessId)
model Brand {  // or keep Tenant, add:
  id          String   @id @default(cuid())
  businessId  String   // NEW: Link to business
  // ... existing fields
  templateId  String?  // NEW: Which template was used
  publishedAt DateTime? // NEW: When was it published
  
  business    Business @relation(fields: [businessId], references: [id])
  template    Template? @relation(fields: [templateId], references: [id])
  
  @@index([businessId])
}

// Template definitions
model Template {
  id          String   @id @default(cuid())
  name        String   // "Fast/Cheap", "Bold/Viral", etc.
  slug        String   @unique
  category    String   // "ecommerce", "funnel", "landing"
  previewUrl  String?
  config      Json     // Default theme, layout, components
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  brands      Brand[]
  
  @@map("templates")
}

// Subscription & billing
model Subscription {
  id          String   @id @default(cuid())
  businessId  String
  plan        PlanType
  status      SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  stripeSubscriptionId String? @unique
  createdAt   DateTime @default(now())
  
  business    Business @relation(fields: [businessId], references: [id])
  
  @@index([businessId])
  @@map("subscriptions")
}

enum PlanType {
  FREE      // 1 brand
  STARTER   // 3 brands
  PRO       // 10 brands
  ENTERPRISE // Unlimited
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
}
```

#### 1.2 User Model Updates

```prisma
model User {
  // ... existing fields
  business    Business? // NEW: User can own a business
  businesses  Business[] // NEW: Users can own multiple businesses (future)
}
```

#### 1.3 API Endpoints to Add

```
POST   /api/auth/signup              # Self-serve signup
POST   /api/businesses               # Create business
GET    /api/businesses/:id           # Get business
GET    /api/businesses/:id/brands    # List brands
POST   /api/businesses/:id/brands    # Create brand from template
GET    /api/templates                 # List available templates
GET    /api/templates/:id             # Get template details
POST   /api/brands/:id/publish       # Publish brand
GET    /api/brands/:id/analytics     # Brand analytics
GET    /api/businesses/:id/analytics # Cross-brand analytics
POST   /api/subscriptions             # Create subscription
GET    /api/subscriptions/:id        # Get subscription
```

### Phase 2: Self-Serve Onboarding (Weeks 5-8)

#### 2.1 Sign-Up Flow

**Frontend**: `/signup` → `/onboarding/business` → `/onboarding/brand`

```typescript
// Flow:
1. Sign up (email/password or OAuth)
2. Create business (name, slug)
3. Choose template
4. Customize brand (name, colors, logo)
5. Publish (provision subdomain)
```

#### 2.2 Template System

**Templates as JSON Configs**:

```typescript
interface TemplateConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    layout: 'minimal' | 'bold' | 'premium' | 'dark';
  };
  components: {
    header: 'minimal' | 'sticky' | 'transparent';
    footer: 'simple' | 'detailed';
    productCard: 'grid' | 'list' | 'carousel';
  };
  features: {
    hasReviews: boolean;
    hasWishlist: boolean;
    hasQuickView: boolean;
  };
}
```

**Template Application**:

```typescript
async function createBrandFromTemplate(
  businessId: string,
  templateId: string,
  customizations: Partial<BrandConfig>
): Promise<Brand> {
  const template = await getTemplate(templateId);
  const brand = await createBrand({
    businessId,
    templateId,
    theme: merge(template.config.theme, customizations.theme),
    // ... apply template defaults
  });
  return brand;
}
```

#### 2.3 Brand Creation Wizard

**Frontend Components**:
- `TemplateSelector` - Grid of template cards
- `BrandCustomizer` - Form for name, colors, logo
- `PreviewPane` - Live preview of brand
- `PublishButton` - Triggers subdomain provisioning

### Phase 3: Visual Editor (Weeks 9-12)

#### 3.1 Controlled Customization

**Guardrails**:
- ✅ Allow: Colors, fonts, logo, text content
- ✅ Allow: Component visibility (show/hide sections)
- ❌ Block: Code injection, custom CSS/JS
- ❌ Block: Database schema changes

**Editor Architecture**:

```typescript
// Editor component tree
<Editor>
  <Sidebar>
    <ThemePanel />      // Colors, fonts
    <ContentPanel />    // Text, images
    <LayoutPanel />     // Component visibility
    <SettingsPanel />   // Domain, SEO
  </Sidebar>
  <PreviewPane>
    <BrandPreview tenantSlug={brand.slug} />
  </PreviewPane>
</Editor>
```

**API for Editor**:

```
PATCH /api/brands/:id/theme          # Update theme
PATCH /api/brands/:id/content        # Update content
PATCH /api/brands/:id/layout         # Update layout
GET    /api/brands/:id/preview       # Get preview data
```

#### 3.2 Preview System

- **Draft Mode**: Changes saved but not published
- **Preview URL**: `https://preview.yourplatform.com/{brand-slug}?draft=true`
- **Publish**: Move from draft → production

### Phase 4: Domain Management (Weeks 13-16)

#### 4.1 Subdomain Provisioning (v1)

**Flow**:
1. User chooses subdomain: `mybrand`
2. Check availability via API
3. Provision: `mybrand.yourplatform.com`
4. Update Vercel/Vercel API to add subdomain
5. Update DNS (if needed)

**Implementation**:

```typescript
async function provisionSubdomain(brandId: string, subdomain: string) {
  // 1. Validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    throw new Error('Invalid subdomain format');
  }
  
  // 2. Check availability
  const exists = await checkSubdomainExists(subdomain);
  if (exists) {
    throw new Error('Subdomain already taken');
  }
  
  // 3. Update brand
  await updateBrand(brandId, { subdomain });
  
  // 4. Provision via Vercel API
  await vercel.addDomain(`${subdomain}.yourplatform.com`);
  
  // 5. Update DNS (if needed)
  // This depends on your DNS provider
}
```

#### 4.2 Custom Domains (v2)

**Flow**:
1. User enters custom domain: `mybrand.com`
2. Show DNS instructions (CNAME record)
3. Verify DNS (poll for CNAME record)
4. Provision SSL certificate
5. Activate domain

**Implementation**:

```typescript
async function setupCustomDomain(brandId: string, domain: string) {
  // 1. Validate domain
  // 2. Generate verification token
  // 3. Show DNS instructions
  // 4. Poll for DNS verification
  // 5. Provision SSL (via Vercel/Let's Encrypt)
  // 6. Activate domain
}
```

### Phase 5: Analytics & Billing (Weeks 17-20)

#### 5.1 Analytics System

**Metrics to Track**:
- Page views per brand
- Conversion rate
- Revenue per brand
- Traffic sources
- User engagement

**Database Schema**:

```prisma
model BrandAnalytics {
  id          String   @id @default(cuid())
  brandId     String
  date        DateTime
  pageViews   Int      @default(0)
  uniqueVisitors Int   @default(0)
  conversions Int      @default(0)
  revenueCents Int     @default(0)
  
  brand       Brand     @relation(fields: [brandId], references: [id])
  
  @@unique([brandId, date])
  @@index([brandId, date])
  @@map("brand_analytics")
}
```

**API Endpoints**:

```
GET /api/brands/:id/analytics?period=7d
GET /api/businesses/:id/analytics?compare=true
```

**Frontend**: Analytics dashboard with charts (Chart.js/Recharts)

#### 5.2 Billing System

**Integration**: Stripe (recommended)

**Flow**:
1. User selects plan
2. Create Stripe Checkout session
3. Webhook: `checkout.session.completed` → Create subscription
4. Webhook: `customer.subscription.updated` → Update plan
5. Enforce limits: Check `brandLimit` before creating brand

**Implementation**:

```typescript
async function createSubscription(businessId: string, plan: PlanType) {
  const business = await getBusiness(businessId);
  const session = await stripe.checkout.sessions.create({
    customer_email: business.owner.email,
    line_items: [{
      price: getStripePriceId(plan),
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${FRONTEND_URL}/dashboard?success=true`,
    cancel_url: `${FRONTEND_URL}/pricing?canceled=true`,
  });
  return session.url;
}

// Enforce limits
async function canCreateBrand(businessId: string): Promise<boolean> {
  const business = await getBusiness(businessId);
  const brandCount = await countBrands(businessId);
  return brandCount < business.brandLimit;
}
```

### Phase 6: AI Features (Weeks 21-24+)

#### 6.1 AI Brand Generator

**Input**: Business description, target audience, industry  
**Output**: Brand name, colors, template recommendation

**Implementation** (using OpenAI/Anthropic):

```typescript
async function generateBrand(businessDescription: string) {
  const prompt = `
    Generate a brand configuration for: ${businessDescription}
    Return JSON with: name, primaryColor, secondaryColor, templateRecommendation
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

#### 6.2 Performance Insights

**Analyze**:
- Which brands perform best?
- What template converts highest?
- What colors drive engagement?

**Implementation**:

```typescript
async function getPerformanceInsights(businessId: string) {
  const brands = await getBrands(businessId);
  const analytics = await getAnalytics(businessId);
  
  // Compare brands
  const insights = {
    bestPerformingBrand: findBestBrand(analytics),
    recommendedTemplate: findBestTemplate(analytics),
    optimizationSuggestions: generateSuggestions(analytics),
  };
  
  return insights;
}
```

#### 6.3 Autonomous Optimization

**Future**: AI automatically A/B tests theme variations, suggests improvements

---

## 🎨 Template System Design

### Template Categories

#### 1. **Fast/Cheap**
- Minimal design
- Fast loading
- Simple checkout
- Target: Price-sensitive customers

#### 2. **Bold/Viral**
- Eye-catching colors
- Social sharing buttons
- Urgency elements (countdown timers)
- Target: Social media traffic

#### 3. **Clean/Premium**
- White space
- High-quality imagery
- Detailed product pages
- Target: High-value customers

#### 4. **Dark/Night**
- Dark theme
- Neon accents
- Modern aesthetic
- Target: Tech-savvy audience

### Template Structure

```typescript
interface Template {
  id: string;
  name: string;
  category: string;
  previewImage: string;
  config: {
    theme: ThemeConfig;
    layout: LayoutConfig;
    components: ComponentConfig;
    features: FeatureConfig;
  };
  defaultContent: {
    hero: { title: string; subtitle: string; };
    cta: { text: string; };
  };
}
```

---

## 🔐 Security & Isolation

### Tenant Isolation (Already Good)

✅ Database: `tenantId` on all tables  
✅ API: Tenant resolved from domain/subdomain  
✅ Frontend: Middleware routes to correct tenant

### Business Isolation (New)

**Add**:
- `businessId` check on all brand operations
- Users can only access brands in their business
- API middleware: Verify `businessId` ownership

```typescript
@UseGuards(JwtAuthGuard, BusinessGuard)
@Get('/businesses/:businessId/brands')
async getBrands(@Param('businessId') businessId: string, @User() user: User) {
  // Verify user owns business
  await this.verifyBusinessOwnership(businessId, user.id);
  return this.brandsService.getBrandsByBusiness(businessId);
}
```

---

## 📈 Migration Strategy

### Option 1: Gradual Evolution (Recommended)

1. **Keep existing tenants** as-is
2. **Add Business layer** on top
3. **Migrate existing tenants** to "default business"
4. **New signups** create business → brand

### Option 2: Clean Slate

1. **Create new schema** alongside existing
2. **Run both systems** in parallel
3. **Migrate data** gradually
4. **Deprecate old system**

**Recommendation**: Option 1 (gradual evolution)

---

## 🚀 MVP Scope (First 3 Months)

### Must Have (MVP)
- ✅ Business → Brand hierarchy
- ✅ Self-serve signup
- ✅ Template selection (4 templates)
- ✅ Basic customization (colors, logo, text)
- ✅ Subdomain provisioning
- ✅ Basic analytics (page views, conversions)
- ✅ Free plan (1 brand) + Starter plan (3 brands)

### Nice to Have (Post-MVP)
- Custom domains
- Visual editor
- Advanced analytics
- AI features

### Future
- Template marketplace
- Third-party integrations
- Mobile apps
- White-label options

---

## 💰 Business Model

### Pricing Tiers

| Plan | Brands | Price | Features |
|------|--------|-------|----------|
| **Free** | 1 | $0 | Subdomain, basic analytics |
| **Starter** | 3 | $29/mo | Subdomain, analytics, email support |
| **Pro** | 10 | $99/mo | Custom domains, advanced analytics, priority support |
| **Enterprise** | Unlimited | Custom | Dedicated support, SLA, custom features |

### Revenue Streams
1. **Subscriptions** (primary)
2. **Transaction fees** (optional: % of revenue)
3. **Template marketplace** (future: premium templates)
4. **White-label licensing** (future)

---

## 🛠️ Technical Stack Recommendations

### Keep (Current)
- ✅ Next.js 14 (frontend)
- ✅ NestJS (backend)
- ✅ PostgreSQL (database)
- ✅ Prisma (ORM)
- ✅ Vercel (frontend hosting)

### Add
- **Stripe** - Subscription billing
- **Vercel API** - Domain provisioning
- **PostHog/Mixpanel** - Analytics
- **OpenAI/Anthropic** - AI features
- **Redis** - Caching, rate limiting

### Consider
- **Turborepo** - Monorepo management
- **tRPC** - Type-safe API (alternative to REST)
- **Zod** - Runtime validation (you might already have this)

---

## 📝 Next Steps

### Immediate (This Week)
1. **Review this document** - Validate approach
2. **Decide on Business model** - Confirm pricing tiers
3. **Design database schema** - Finalize Prisma schema changes
4. **Create migration plan** - How to evolve existing system

### Short Term (This Month)
1. **Implement Business entity** - Database + API
2. **Build signup flow** - Frontend + backend
3. **Create 4 templates** - Define template configs
4. **Build brand creation wizard** - Frontend UI

### Medium Term (Next 3 Months)
1. **Visual editor** - Controlled customization
2. **Subdomain provisioning** - V1 domain management
3. **Analytics dashboard** - Basic metrics
4. **Stripe integration** - Billing system

---

## 🤔 Open Questions

1. **Template System**: Build custom or use existing (Webflow, Framer)?
2. **Editor**: Build from scratch or use existing (Builder.io, Plasmic)?
3. **Domain Management**: Vercel API or custom DNS provider?
4. **Analytics**: Build custom or integrate (PostHog, Mixpanel)?
5. **AI Features**: Which provider? (OpenAI, Anthropic, self-hosted?)

---

## 💡 Key Insights

### What Makes This Different

1. **Horizontal vs Vertical**: Not just pizza, but any business type
2. **Self-Serve vs Managed**: No founder intervention needed
3. **Template-First**: Start with templates, customize from there
4. **Multi-Brand Focus**: Built for businesses running multiple brands
5. **AI-Native**: AI features from day 1 (roadmap)

### Competitive Advantages

- ✅ **Existing multi-tenant architecture** - You're ahead
- ✅ **Proven backend** - Already handles scale
- ✅ **Template system** - Differentiates from generic builders
- ✅ **Multi-brand analytics** - Unique value prop

### Risks to Mitigate

- ⚠️ **Scope creep** - Stay focused on MVP
- ⚠️ **Template quality** - Need great templates
- ⚠️ **Support burden** - Self-serve = less support, but need good docs
- ⚠️ **Competition** - Webflow, Framer, Shopify all have templates

---

## 🎯 Success Metrics

### Technical
- Signup → First brand published: < 10 minutes
- Template application: < 30 seconds
- Editor save time: < 1 second
- Uptime: 99.9%

### Business
- Monthly signups: Target 100+ in first 3 months
- Conversion rate (free → paid): Target 10%
- Churn rate: < 5% monthly
- NPS: > 50

---

## 📚 Resources

### Inspiration
- **Webflow** - Visual editor, templates
- **Shopify** - Multi-store, themes
- **Vercel** - Domain management, deployment
- **Stripe** - Billing, subscriptions

### Documentation to Create
- API documentation (OpenAPI/Swagger)
- Template development guide
- Self-serve onboarding guide
- Analytics dashboard guide

---

**Last Updated**: 2025-01-XX  
**Status**: Vision Document — Ready for Review




