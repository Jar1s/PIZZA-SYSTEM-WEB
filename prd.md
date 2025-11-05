# 🍕 Multi-Brand Pizzeria Ecosystem — PRD v1.0

## 1. Purpose
Create one system that powers multiple pizza brands (PornoPizza, Pizza v Núdzi, MaydayPizza, etc.) while sharing a single kitchen, backend, and delivery infrastructure.

Each brand:
- unique domain, branding, and menu
- integrated online ordering and payments
- automated courier dispatch via **Wolt Drive API**

HQ dashboard unifies all brands’ orders, payments, and analytics.

---

## 2. Goals & Success Criteria
| Goal | Metric |
|------|---------|
| Launch new brand | < 2 hours setup |
| Stable payments | 99 % success |
| Delivery automation | 90 % via Wolt Drive |
| Central visibility | one live dashboard |
| Scale | 50+ brands supported |

---

## 3. Scope
### In-scope
- Multi-tenant frontend (Next.js 14)
- Backend (NestJS + PostgreSQL + Prisma)
- Brand theming / domain mapping
- Checkout + payments (Adyen / GoPay / GP WebPay)
- Wolt Drive integration
- Order management dashboard
- Customer tracking page
- Analytics + exports

### Out-of-scope (MVP)
- Bolt Food / Wolt marketplace ingestion
- Loyalty, coupons, POS, CRM

---

## 4. User Roles
| Role | Description | Needs |
|------|--------------|-------|
| Customer | Orders on brand site | Fast UX, payment, tracking |
| Kitchen Staff | Prepares all orders | Unified queue |
| Admin/Owner | Manages brands & analytics | Dashboard |
| Courier (Wolt) | Delivers | API dispatch |

---

## 5. Functional Requirements
### 5.1 Multi-Tenant
- `tenant_id` column on all entities
- Subdomain/domain routing
- JSON theme config per brand
- Brand-specific payment + Wolt keys

### 5.2 Menu & Products
- CRUD for categories, products, modifiers
- Multi-currency, VAT
- Cache menus 60 s

### 5.3 Checkout & Payments
- Hosted redirect flow (MVP)
- 3-D Secure, Apple / Google Pay
- Webhooks → update order status

### 5.4 Delivery (Wolt Drive)
- Quote endpoint (ETA + fee)
- Create delivery job post-payment
- Webhooks: courier_assigned / picked / delivered

### 5.5 Orders
Statuses: `pending`, `paid`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `canceled`

### 5.6 Dashboard
- Filters: brand / status / date
- Live order stream
- KPIs: revenue, avg ticket, prep time

### 5.7 Customer Tracking
Public `/track/:id` with live courier updates.

---

## 6. Non-Functional
| Area | Target |
|------|--------|
| API latency | < 300 ms |
| Uptime | 99.9 % |
| PCI compliance | via PSP |
| Languages | SK / EN |
| Monitoring | Sentry + Logtail |

---

## 7. Tech Stack
| Layer | Tools |
|-------|-------|
| Frontend | Next.js 14 + Tailwind + Framer Motion |
| Backend | Node 18 + NestJS + Prisma + PostgreSQL |
| Infra | Vercel (front) / Fly.io (back) / Redis (cache) |
| Payments | Adyen / GoPay / GP WebPay |
| Delivery | Wolt Drive API |
| Auth | Clerk / Auth.js |
| Analytics | GA4 + Meta Pixel |

---

## 8. Data Model (simplified)

```sql
tenants(id, slug, name, domain, theme_json, payment_provider, delivery_provider)
products(id, tenant_id, name, price_cents, tax_rate, is_active)
orders(id, tenant_id, status, payment_ref, delivery_ref, totals_json, customer_json, address_json)
order_items(order_id, product_id, qty, modifiers_json, price_cents)
deliveries(id, tenant_id, provider, job_id, status, tracking_url, quote_json) 

Integrations
dyen / GoPay / GP WebPay
Payments
Wolt Drive API
Courier automation
Google Maps API
Address → geo
SendGrid / Twilio
Confirmations
GA4 / Meta Pixel
Analytics


Roadmap 
Phase 1 (MVP – 4 wks)
Multi-tenant + checkout + Wolt Drive + basic dashboard

Phase 2 (Ops – 4 wks)
Bolt Food ingestion + roles + analytics

Phase 3 (Growth)
Loyalty + mobile apps + AI menu optimizer 

Deliverables
	•	Next.js app repo
	•	NestJS API repo
	•	Postgres schema + migrations
	•	Docs (README, API.md, .env.example)
	•	CI/CD pipeline
	•	Sample tenants (PornoPizza, Pizza v Núdzi) 


    