# Directory Platform — Design Document
**Date:** 2026-03-17
**Stack:** Next.js 16 (App Router, monolithic) · TypeScript · Drizzle ORM · Neon PostgreSQL · NextAuth v5 · Stripe · UploadThing · Google Maps API · TailwindCSS

---

## Overview
Subscription-based professional directory for vetted boudoir photographers and supporting professionals. Professionals pay monthly to appear; all listings are manually approved before going public. Users discover professionals via name search, location/radius search, and category filtering.

---

## Architecture
Single Next.js 16 monolith:
- **Frontend**: App Router with React Server Components + Client Components
- **Backend**: Next.js Route Handlers (`/api/*`)
- **Database**: Neon PostgreSQL with `pg_trgm` + `postgis` extensions
- **ORM**: Drizzle (SQL-first, natural alongside raw geospatial SQL)
- **Auth**: NextAuth v5 with Drizzle adapter (email+password)
- **Payments**: Stripe subscriptions with webhook handling
- **Images**: UploadThing
- **Geocoding**: Google Maps Geocoding API

---

## Database Schema

### Tables
| Table | Purpose |
|---|---|
| `users` | email, hashed password, role: `professional\|admin` |
| `professionals` | profile, lat/lng (PostGIS), city/zip, service_radius, status: `pending\|approved\|rejected\|suspended`, tier, tsvector for FTS |
| `categories` | boudoir_photographer, makeup_artist, hair_stylist, wardrobe_stylist, etc. |
| `professional_categories` | junction: professional ↔ category |
| `portfolio_images` | UploadThing URLs, sort_order, is_approved |
| `subscriptions` | stripe_customer_id, stripe_subscription_id, status: `active\|past_due\|canceled` |
| `reviews` | rating 1–5, body, reviewer_email, is_approved |
| `applications` | review notes, reviewed_by, reviewed_at |
| `blog_posts` | title, slug, body, excerpt, published_at |

### Extensions
- `pg_trgm` — fuzzy/partial name matching with GIN index
- `postgis` — radius queries with `ST_DWithin` on `GEOGRAPHY(Point)` column

### Key Indexes
- GIN on `tsvector` column (full-text search)
- GIN `pg_trgm` on `professionals.name` (partial/fuzzy)
- PostGIS spatial index on geography column

### Visibility Rule
Profile appears in search **only if**:
```sql
professionals.status = 'approved' AND subscriptions.status = 'active'
```

---

## Subscription Tiers

| Tier | Price | Portfolio Images | Search Ranking | Badge |
|---|---|---|---|---|
| Basic | $29/mo | 10 images | Standard | — |
| Professional | $59/mo | 30 images | Boosted | ✓ Pro |
| Elite | $99/mo | Unlimited | Top + Homepage | ✓ Elite |

---

## Search System

### Name Search
- PostgreSQL full-text search via `tsvector` (primary)
- `pg_trgm` similarity for fuzzy/partial matching fallback
- Combined with `ts_rank` for relevance scoring

### Location Search
1. User inputs city/ZIP → geocoded to lat/lng via Google Maps API
2. `ST_DWithin(geography, ST_MakePoint(lng, lat)::geography, radius_meters)` filters results
3. `ST_Distance` used for ordering by proximity

### Combined Search (name + location + category)
Single `/api/search` endpoint accepts `q`, `lat`, `lng`, `radius`, `category`, `page`.
Results ranked by: **tier** → **verification** → **distance** → **profile completeness**

---

## Pages & Routes

### Public
```
/                          Homepage with hero search bar
/search                    Results (name + location + category filters)
/professionals/[slug]      Full profile: gallery, bio, reviews, contact form
/categories/[slug]         SEO category landing page
/cities/[slug]             SEO city landing page
/blog                      Blog index
/blog/[slug]               Blog article
/join                      Multi-step professional application
```

### Professional Dashboard (`/dashboard/*`)
```
/dashboard                 Overview + subscription status warning
/dashboard/profile         Edit bio, location, radius, categories
/dashboard/portfolio       Upload/reorder/delete images
/dashboard/subscription    Stripe billing portal link
```

### Admin Panel (`/admin/*`)
```
/admin                     Stats: pending apps, active subs, total professionals
/admin/applications        Review queue: approve / reject with notes
/admin/professionals       Full list: edit, suspend, view subscription
/admin/reviews             Approve / reject submitted reviews
/admin/blog                Create / edit / publish blog posts
```

### API Routes
```
/api/auth/[...nextauth]    NextAuth
/api/search                GET — combined search
/api/geocode               GET — city/ZIP → lat/lng
/api/stripe/checkout       POST — create Stripe checkout session
/api/stripe/portal         POST — billing portal redirect
/api/stripe/webhook        POST — handle Stripe events
/api/upload                POST/GET — UploadThing handler
/api/reviews               POST — submit review
/api/admin/applications    PATCH — approve/reject
/api/admin/professionals   PATCH/DELETE — manage listings
/api/admin/reviews         PATCH — moderate reviews
/api/admin/blog            POST/PATCH/DELETE — blog CRUD
```

---

## Auth Flow
- **Professionals**: sign up → pay subscription → fill profile → submit for approval → admin approves → live
- **Admins**: pre-seeded account with `role=admin`, `/admin/*` routes protected by middleware
- **NextAuth v5**: credentials provider (email + bcrypt password), JWT sessions

---

## Stripe Subscription Flow
1. Professional completes profile → redirected to Stripe Checkout (subscription)
2. On `checkout.session.completed` webhook → set `subscriptions.status = active`
3. On `invoice.payment_failed` → set status = `past_due` → profile hidden from search
4. On `customer.subscription.deleted` → status = `canceled` → profile hidden
5. Professional can access Stripe Customer Portal to manage billing

---

## Seed Data
Realistic data for demo:
- 3 admin users
- 50 professionals across 10 US cities (approved + active subscriptions)
- 10 pending applications
- 5 categories with 10 professionals each
- 200+ portfolio images (placeholder URLs)
- 100+ reviews
- 5 blog posts
- City and category landing page data

---

## Key Environment Variables
```
DATABASE_URL                    Neon PostgreSQL
NEXTAUTH_SECRET                 Generated secret
NEXTAUTH_URL                    http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET           (set after Vercel deploy)
UPLOADTHING_TOKEN
GOOGLE_MAPS_API_KEY
```
