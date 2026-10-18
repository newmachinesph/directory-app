# Directory Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack subscription-based boudoir professional directory with name+location search, Stripe subscriptions, admin approval workflow, and seeded demo data.

**Architecture:** Next.js 16 App Router monolith with Drizzle ORM on Neon PostgreSQL (PostGIS + pg_trgm). NextAuth v5 for auth, Stripe for subscriptions, UploadThing for images, Google Maps for geocoding.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, Neon PostgreSQL, NextAuth v5, Stripe, UploadThing, Google Maps Geocoding API, TailwindCSS, shadcn/ui

---

## Phase 1: Project Foundation

### Task 1: Scaffold Next.js 16 project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`

**Step 1: Initialize project**
```bash
cd "c:/Users/llino/OneDrive/Desktop/project"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

**Step 2: Install all dependencies**
```bash
npm install drizzle-orm @neondatabase/serverless drizzle-kit
npm install next-auth@beta @auth/drizzle-adapter
npm install stripe @stripe/stripe-js
npm install uploadthing @uploadthing/react
npm install bcryptjs
npm install @types/bcryptjs --save-dev
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-avatar @radix-ui/react-badge @radix-ui/react-dropdown-menu @radix-ui/react-toast @radix-ui/react-separator @radix-ui/react-label @radix-ui/react-slider @radix-ui/react-checkbox
npm install react-hook-form @hookform/resolvers zod
npm install next-themes
npm install date-fns
npm install slugify
```

**Step 3: Initialize shadcn/ui**
```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label badge avatar separator tabs dialog select toast dropdown-menu slider checkbox textarea
```

**Step 4: Update next.config.ts**
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};
export default nextConfig;
```

**Step 5: Commit**
```bash
git init
git add .
git commit -m "feat: scaffold Next.js 16 project with all dependencies"
```

---

### Task 2: Environment + Drizzle config

**Files:**
- Create: `src/lib/db.ts`, `drizzle.config.ts`, update `.env`

**Step 1: Generate NEXTAUTH_SECRET**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to `.env`:
```
NEXTAUTH_SECRET=<generated>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<your-admin-password>
```

**Step 2: Create `drizzle.config.ts`**
```ts
import type { Config } from "drizzle-kit";
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

**Step 3: Create `src/lib/db.ts`**
```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

**Step 4: Add scripts to `package.json`**
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:seed": "npx tsx src/db/seed.ts"
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: configure Drizzle ORM with Neon"
```

---

### Task 3: Database schema

**Files:**
- Create: `src/db/schema.ts`

**Step 1: Enable extensions via raw SQL (run once in Neon console or migration)**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Step 2: Create `src/db/schema.ts`**
```ts
import {
  pgTable, text, varchar, integer, real, boolean,
  timestamp, pgEnum, uuid, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

// Custom PostGIS geography type
const geography = customType<{ data: string }>({
  dataType() { return "geography(Point, 4326)"; },
});

// Enums
export const userRoleEnum = pgEnum("user_role", ["professional", "admin"]);
export const professionalStatusEnum = pgEnum("professional_status", ["pending", "approved", "rejected", "suspended"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "trialing", "incomplete"]);
export const tierEnum = pgEnum("tier", ["basic", "professional", "elite"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("professional"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Professionals
export const professionals = pgTable("professionals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  bio: text("bio"),
  specialties: text("specialties"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zip: varchar("zip", { length: 20 }),
  country: varchar("country", { length: 100 }).default("US"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location: geography("location"),
  serviceRadiusMiles: integer("service_radius_miles").default(50),
  status: professionalStatusEnum("status").notNull().default("pending"),
  tier: tierEnum("tier").notNull().default("basic"),
  searchVector: text("search_vector"),
  profileCompleteness: integer("profile_completeness").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("professionals_name_idx").on(t.name),
  slugIdx: uniqueIndex("professionals_slug_idx").on(t.slug),
  statusIdx: index("professionals_status_idx").on(t.status),
  cityIdx: index("professionals_city_idx").on(t.city),
}));

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
});

// Professional ↔ Category junction
export const professionalCategories = pgTable("professional_categories", {
  professionalId: uuid("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
});

// Portfolio images
export const portfolioImages = pgTable("portfolio_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  status: subscriptionStatusEnum("status").notNull().default("incomplete"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
  reviewerName: varchar("reviewer_name", { length: 100 }).notNull(),
  reviewerEmail: varchar("reviewer_email", { length: 255 }),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Applications
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
  status: applicationStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blog posts
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  body: text("body").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  author: varchar("author", { length: 100 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type Professional = typeof professionals.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
```

**Step 3: Generate and run migrations**
```bash
npm run db:generate
npm run db:migrate
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: complete database schema with PostGIS and pg_trgm"
```

---

## Phase 2: Authentication

### Task 4: NextAuth v5 setup

**Files:**
- Create: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`
- Create: `src/app/(auth)/signin/page.tsx`, `src/app/(auth)/signup/page.tsx`

**Step 1: Create `src/auth.ts`**
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email as string));
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; }
      return token;
    },
    session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; (session.user as any).role = token.role; }
      return session;
    },
  },
  pages: { signIn: "/signin", error: "/signin" },
  session: { strategy: "jwt" },
});
```

**Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**
```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**Step 3: Create `src/middleware.ts`**
```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  if (pathname.startsWith("/dashboard") && !isAuthed) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*", "/dashboard/:path*"] };
```

**Step 4: Create `src/app/(auth)/signin/page.tsx`** — Sign-in form with email/password using shadcn Card + react-hook-form + zod.

**Step 5: Create `src/app/(auth)/signup/page.tsx`** — Registration form. On submit: hash password with bcrypt, insert user, redirect to `/join`.

**Step 6: Create `src/app/api/auth/register/route.ts`**
```ts
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const hash = await bcrypt.hash(password, 12);
  try {
    const [user] = await db.insert(users).values({ email, passwordHash: hash, role: "professional" }).returning();
    return NextResponse.json({ id: user.id });
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }
}
```

**Step 7: Commit**
```bash
git add .
git commit -m "feat: NextAuth v5 with credentials provider and route protection"
```

---

## Phase 3: Seed Data

### Task 5: Realistic seed data

**Files:**
- Create: `src/db/seed.ts`

**Step 1: Create comprehensive seed file**

Seed includes:
- 1 admin user (`admin@example.com` / `<your-admin-password>`)
- 8 categories: Boudoir Photographer, Makeup Artist, Hair Stylist, Wardrobe Stylist, Lingerie Boutique, Body Painter, Retoucher, Photography Studio
- 50 professionals across cities: New York NY, Los Angeles CA, Chicago IL, Houston TX, Dallas TX, Atlanta GA, Miami FL, Baton Rouge LA, Nashville TN, Denver CO
- Each professional: approved status, active subscription, 4-8 portfolio images, 2-4 reviews, correct lat/lng
- 10 pending applications
- 5 blog posts

```ts
import { db } from "@/lib/db";
import { users, professionals, categories, professionalCategories, portfolioImages, subscriptions, reviews, applications, blogPosts } from "./schema";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { sql } from "drizzle-orm";

const CITIES = [
  { city: "New York", state: "NY", zip: "10001", lat: 40.7128, lng: -74.0060 },
  { city: "Los Angeles", state: "CA", zip: "90001", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", state: "IL", zip: "60601", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", state: "TX", zip: "77001", lat: 29.7604, lng: -95.3698 },
  { city: "Dallas", state: "TX", zip: "75201", lat: 32.7767, lng: -96.7970 },
  { city: "Atlanta", state: "GA", zip: "30301", lat: 33.7490, lng: -84.3880 },
  { city: "Miami", state: "FL", zip: "33101", lat: 25.7617, lng: -80.1918 },
  { city: "Baton Rouge", state: "LA", zip: "70801", lat: 30.4515, lng: -91.1871 },
  { city: "Nashville", state: "TN", zip: "37201", lat: 36.1627, lng: -86.7816 },
  { city: "Denver", state: "CO", zip: "80201", lat: 39.7392, lng: -104.9903 },
];

const PROFESSIONAL_NAMES = [
  "Velvet Rose Boudoir", "Studio Noir Photography", "Sarah Thompson Photography",
  "The Intimate Frame", "Lace & Light Studio", "Golden Hour Boudoir",
  "Midnight Muse Photography", "Silk & Shadow Studio", "Belle Époque Boudoir",
  "Crimson Lens Studio", "Aurora Boudoir Co", "Whisper & Light Photography",
  "The Boudoir Collective", "Sable Studio", "Ivory & Ink Photography",
  "Luna Rose Boudoir", "Noir & Nude Studio", "The Velvet Room",
  "Ember Light Photography", "Magnolia Boudoir Studio", "Scarlett Frame Co",
  "The Opulent Lens", "Blossom & Bare Studio", "Diamond Dusk Photography",
  "The Intimate Gallery", "Raven Photography Studio", "Seraphina Boudoir",
  "Fleur Noire Studio", "Luxe Lens Boudoir", "Gossamer Light Photography",
  "Obsidian Studio", "Pearl & Petal Boudoir", "Copper Hour Photography",
  "The Allure Studio", "Halo Light Boudoir", "Jasmine & Co Photography",
  "Studio Glow Boudoir", "Celeste Photography", "The Boudoir Suite",
  "Amara Light Studio", "Onyx Frame Photography", "Rose Gold Boudoir",
  "The Sultry Frame", "Dusk & Dawn Photography", "Studio Reverie",
  "Bare Beauty Photography", "The Lux Boudoir", "Siren Photography Co",
  "Penumbra Studio", "Veritas Boudoir Photography",
];

const BIOS = [
  "Specializing in empowering boudoir photography that celebrates every body. With over 8 years of experience, I create a safe, comfortable space for every client.",
  "Award-winning photographer focused on intimate portraiture. My studio is a judgment-free zone where confidence is born.",
  "Luxury boudoir photography in the heart of the city. Every session is tailored to highlight your unique beauty.",
  "I believe every person deserves to see themselves as the work of art they truly are. Let's create magic together.",
  "Fine art boudoir photography with a cinematic touch. Serving clients across the metro area with a travel radius of 75 miles.",
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("<your-admin-password>", 12);
  const [adminUser] = await db.insert(users).values({
    email: "admin@example.com",
    passwordHash: adminHash,
    role: "admin",
  }).returning().onConflictDoNothing();

  // Categories
  const categoryData = [
    { name: "Boudoir Photographer", slug: "boudoir-photographer", description: "Professional boudoir and intimate portraiture", icon: "camera", sortOrder: 1 },
    { name: "Makeup Artist", slug: "makeup-artist", description: "Professional makeup for boudoir sessions", icon: "sparkles", sortOrder: 2 },
    { name: "Hair Stylist", slug: "hair-stylist", description: "Hair styling for photoshoots", icon: "scissors", sortOrder: 3 },
    { name: "Wardrobe Stylist", slug: "wardrobe-stylist", description: "Wardrobe and lingerie styling", icon: "shirt", sortOrder: 4 },
    { name: "Lingerie Boutique", slug: "lingerie-boutique", description: "Luxury lingerie retailers", icon: "heart", sortOrder: 5 },
    { name: "Body Painter", slug: "body-painter", description: "Professional body painting artists", icon: "palette", sortOrder: 6 },
    { name: "Photo Retoucher", slug: "photo-retoucher", description: "Post-processing and retouching specialists", icon: "image", sortOrder: 7 },
    { name: "Photography Studio", slug: "photography-studio", description: "Rentable studio spaces", icon: "building", sortOrder: 8 },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning().onConflictDoNothing();

  // 50 professionals
  for (let i = 0; i < 50; i++) {
    const cityData = CITIES[i % CITIES.length];
    const name = PROFESSIONAL_NAMES[i];
    const slug = slugify(name, { lower: true, strict: true }) + `-${i}`;
    const tier = i < 10 ? "elite" : i < 25 ? "professional" : "basic";

    const hash = await bcrypt.hash("Pro123!", 12);
    const [user] = await db.insert(users).values({
      email: `pro${i}@example.com`,
      passwordHash: hash,
      role: "professional",
    }).returning();

    const [pro] = await db.insert(professionals).values({
      userId: user.id,
      name,
      slug,
      bio: BIOS[i % BIOS.length],
      specialties: "Boudoir, Intimate Portraiture, Empowerment Photography",
      contactEmail: `contact@${slug}.com`,
      city: cityData.city,
      state: cityData.state,
      zip: cityData.zip,
      country: "US",
      latitude: cityData.lat + (Math.random() - 0.5) * 0.1,
      longitude: cityData.lng + (Math.random() - 0.5) * 0.1,
      serviceRadiusMiles: [25, 50, 75, 100][i % 4],
      status: "approved",
      tier: tier as any,
      profileCompleteness: 85 + (i % 15),
    }).returning();

    // Update PostGIS location column
    await db.execute(sql`
      UPDATE professionals
      SET location = ST_MakePoint(${pro.longitude}, ${pro.latitude})::geography
      WHERE id = ${pro.id}
    `);

    // Subscription
    await db.insert(subscriptions).values({
      professionalId: pro.id,
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Portfolio images (Unsplash placeholder)
    const imageCount = 4 + (i % 5);
    for (let j = 0; j < imageCount; j++) {
      await db.insert(portfolioImages).values({
        professionalId: pro.id,
        url: `https://picsum.photos/seed/${slug}-${j}/800/1000`,
        caption: `Portfolio piece ${j + 1}`,
        sortOrder: j,
        isApproved: true,
      });
    }

    // Categories (2 per professional)
    const catIdx1 = i % insertedCategories.length;
    const catIdx2 = (i + 1) % insertedCategories.length;
    await db.insert(professionalCategories).values([
      { professionalId: pro.id, categoryId: insertedCategories[catIdx1].id },
      { professionalId: pro.id, categoryId: insertedCategories[catIdx2].id },
    ]).onConflictDoNothing();

    // Reviews
    const reviewCount = 2 + (i % 3);
    const reviewNames = ["Emily R.", "Jessica M.", "Amanda K.", "Sarah L.", "Nicole T."];
    for (let k = 0; k < reviewCount; k++) {
      await db.insert(reviews).values({
        professionalId: pro.id,
        reviewerName: reviewNames[k % reviewNames.length],
        rating: 4 + (k % 2),
        body: "Absolutely amazing experience! Felt so comfortable and the photos turned out stunning. Would 100% recommend to anyone considering a boudoir session.",
        isApproved: true,
      });
    }

    // Update search vector
    await db.execute(sql`
      UPDATE professionals
      SET search_vector = to_tsvector('english', name || ' ' || COALESCE(bio, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(state, ''))
      WHERE id = ${pro.id}
    `);
  }

  // 10 pending applications
  for (let i = 50; i < 60; i++) {
    const name = `Pending Studio ${i}`;
    const cityData = CITIES[i % CITIES.length];
    const hash = await bcrypt.hash("Pro123!", 12);
    const [user] = await db.insert(users).values({
      email: `pending${i}@example.com`,
      passwordHash: hash,
      role: "professional",
    }).returning();
    const [pro] = await db.insert(professionals).values({
      userId: user.id,
      name,
      slug: `pending-studio-${i}`,
      bio: BIOS[i % BIOS.length],
      city: cityData.city,
      state: cityData.state,
      zip: cityData.zip,
      latitude: cityData.lat,
      longitude: cityData.lng,
      status: "pending",
      tier: "basic",
    }).returning();
    await db.insert(applications).values({ professionalId: pro.id, status: "pending" });
  }

  // Blog posts
  const blogData = [
    { title: "How to Prepare for Your Boudoir Session", slug: "how-to-prepare-boudoir-session", excerpt: "Everything you need to know before your first boudoir photoshoot.", body: "A boudoir session is one of the most empowering experiences you can give yourself...", author: "The Directory Team", publishedAt: new Date("2026-01-15") },
    { title: "Top 10 Boudoir Photographers in New York", slug: "top-boudoir-photographers-new-york", excerpt: "Find the best boudoir photographers NYC has to offer.", body: "New York City is home to some of the world's most talented boudoir photographers...", author: "The Directory Team", publishedAt: new Date("2026-02-01") },
    { title: "What to Wear for a Boudoir Shoot", slug: "what-to-wear-boudoir-shoot", excerpt: "A complete guide to choosing outfits that photograph beautifully.", body: "Choosing the right wardrobe can make or break your boudoir session...", author: "The Directory Team", publishedAt: new Date("2026-02-20") },
    { title: "The Rise of Empowerment Photography", slug: "rise-of-empowerment-photography", excerpt: "How boudoir photography became a tool for self-love.", body: "Over the past decade, boudoir photography has transformed...", author: "The Directory Team", publishedAt: new Date("2026-03-05") },
    { title: "How to Choose the Right Boudoir Photographer", slug: "how-to-choose-boudoir-photographer", excerpt: "Key questions to ask before booking your session.", body: "Choosing a boudoir photographer is a deeply personal decision...", author: "The Directory Team", publishedAt: new Date("2026-03-10") },
  ];
  await db.insert(blogPosts).values(blogData).onConflictDoNothing();

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch(console.error);
```

**Step 2: Run seed**
```bash
npm run db:seed
```

**Step 3: Commit**
```bash
git add .
git commit -m "feat: comprehensive seed data with 50 professionals across 10 cities"
```

---

## Phase 4: Search API

### Task 6: Search API route

**Files:**
- Create: `src/app/api/search/route.ts`, `src/app/api/geocode/route.ts`

**Step 1: Create `src/app/api/geocode/route.ts`**
```ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "No query" }, { status: 400 });

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results?.[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { lat, lng } = data.results[0].geometry.location;
  const formatted = data.results[0].formatted_address;
  return NextResponse.json({ lat, lng, formatted });
}
```

**Step 2: Create `src/app/api/search/route.ts`**
```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = p.get("q") || "";
  const lat = parseFloat(p.get("lat") || "");
  const lng = parseFloat(p.get("lng") || "");
  const radius = parseInt(p.get("radius") || "50");
  const category = p.get("category") || "";
  const page = parseInt(p.get("page") || "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  const radiusMeters = radius * 1609.34;

  const results = await db.execute(sql`
    SELECT DISTINCT
      p.id, p.name, p.slug, p.bio, p.city, p.state, p.tier,
      p.latitude, p.longitude, p.service_radius_miles,
      p.profile_completeness, p.contact_email,
      CASE WHEN ${!!lat && !!lng} THEN
        ST_Distance(p.location, ST_MakePoint(${lng || 0}, ${lat || 0})::geography) / 1609.34
      ELSE NULL END as distance_miles,
      (
        SELECT json_agg(json_build_object('url', pi.url, 'caption', pi.caption))
        FROM portfolio_images pi
        WHERE pi.professional_id = p.id AND pi.is_approved = true
        ORDER BY pi.sort_order LIMIT 1
      ) as cover_image,
      (
        SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
        FROM categories c
        JOIN professional_categories pc ON pc.category_id = c.id
        WHERE pc.professional_id = p.id
      ) as categories,
      (
        SELECT COALESCE(AVG(r.rating), 0)::numeric(3,1)
        FROM reviews r
        WHERE r.professional_id = p.id AND r.is_approved = true
      ) as avg_rating,
      (
        SELECT COUNT(*)::int
        FROM reviews r
        WHERE r.professional_id = p.id AND r.is_approved = true
      ) as review_count
    FROM professionals p
    JOIN subscriptions s ON s.professional_id = p.id
    WHERE
      p.status = 'approved'
      AND s.status = 'active'
      AND (
        ${q === ""} OR (
          p.search_vector @@ plainto_tsquery('english', ${q})
          OR similarity(p.name, ${q}) > 0.2
          OR p.name ILIKE ${'%' + q + '%'}
        )
      )
      AND (
        ${!lat || !lng} OR
        ST_DWithin(p.location, ST_MakePoint(${lng || 0}, ${lat || 0})::geography, ${radiusMeters})
      )
      AND (
        ${category === ""} OR EXISTS (
          SELECT 1 FROM professional_categories pc
          JOIN categories c ON c.id = pc.category_id
          WHERE pc.professional_id = p.id AND c.slug = ${category}
        )
      )
    ORDER BY
      CASE p.tier WHEN 'elite' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END,
      CASE WHEN ${!!lat && !!lng} THEN ST_Distance(p.location, ST_MakePoint(${lng || 0}, ${lat || 0})::geography) ELSE 0 END,
      p.profile_completeness DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const countResult = await db.execute(sql`
    SELECT COUNT(DISTINCT p.id)::int as total
    FROM professionals p
    JOIN subscriptions s ON s.professional_id = p.id
    WHERE p.status = 'approved' AND s.status = 'active'
    AND (${q === ""} OR p.name ILIKE ${'%' + q + '%'})
  `);

  return NextResponse.json({
    results: results.rows,
    total: (countResult.rows[0] as any).total,
    page,
    totalPages: Math.ceil((countResult.rows[0] as any).total / limit),
  });
}
```

**Step 3: Commit**
```bash
git add .
git commit -m "feat: search API with PostGIS radius + pg_trgm fuzzy name matching"
```

---

## Phase 5: Public UI

### Task 7: Layout, homepage, and shared components

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/ui/ProfessionalCard.tsx`

**Step 1: Create root layout with providers**
- Dark/light theme via `next-themes`
- Toaster from shadcn
- Sticky header with logo + nav + sign-in button

**Step 2: Create homepage `src/app/page.tsx`**
- Hero section: large headline + `SearchBar` component
- Featured professionals grid (top 6 Elite tier)
- Category pills linking to `/categories/[slug]`
- Stats bar: "500+ Professionals · 50+ Cities · Fully Vetted"
- Recent blog posts (3)

**Step 3: `SearchBar` component**
- Two inputs: name (text) and location (text + "Use my location" button)
- Radius selector (10/25/50/100 miles)
- Category dropdown
- On submit → `router.push('/search?q=...&location=...&radius=...')`
- Geocodes the location input before navigating

**Step 4: `ProfessionalCard` component**
- Cover image (first portfolio image)
- Name + tier badge (Basic/Pro/Elite)
- City, state
- Categories
- Star rating + review count
- "View Profile" button
- Elite cards have gold border accent

**Step 5: Commit**
```bash
git add .
git commit -m "feat: homepage, layout, search bar, professional card"
```

---

### Task 8: Search results page

**Files:**
- Create: `src/app/search/page.tsx`, `src/app/search/SearchResults.tsx`

**Step 1: `src/app/search/page.tsx`** — Server component reads searchParams, passes to client component.

**Step 2: `SearchResults.tsx`** — Client component:
- Sidebar filters: category checkboxes, radius slider, tier filter
- Top: search bar (pre-filled from URL params)
- Results grid: `ProfessionalCard` × 12 per page
- Pagination
- "X professionals found near [location]"
- Loading skeleton state
- Empty state with suggestion to broaden search

**Step 3: Commit**
```bash
git add .
git commit -m "feat: search results page with filters and pagination"
```

---

### Task 9: Professional profile page

**Files:**
- Create: `src/app/professionals/[slug]/page.tsx`
- Create: `src/components/profile/PortfolioGallery.tsx`
- Create: `src/components/profile/ReviewSection.tsx`
- Create: `src/components/profile/ContactForm.tsx`

**Step 1: Fetch professional data**
```ts
// Fetch: professional + portfolio images + reviews + categories
// Return 404 if not found or not approved+active
```

**Step 2: Profile page layout**
- Hero: cover image + name + tier badge + location + categories
- Bio + specialties
- Service area map (Google Maps embed or static map image)
- Portfolio gallery (masonry grid, lightbox on click)
- Reviews section: star rating average + review cards
- Contact form: name, email, message → sends to professional's contact email (logged to console for now, email skipped)
- Sidebar: "Book a Session" CTA + social links

**Step 3: Commit**
```bash
git add .
git commit -m "feat: professional profile page with gallery and reviews"
```

---

### Task 10: Join / application flow

**Files:**
- Create: `src/app/join/page.tsx` — multi-step form
- Create: `src/app/api/professionals/apply/route.ts`

**Step 1: Multi-step form (4 steps)**
1. Account: email + password (creates user)
2. Profile: name, bio, specialties, categories
3. Location: city, state, ZIP, service radius (geocodes on submit)
4. Portfolio: UploadThing image upload (min 3 images)

**Step 2: On completion → create professional record with status=pending + application record → show "Application submitted, pending review"**

**Step 3: Commit**
```bash
git add .
git commit -m "feat: professional onboarding multi-step application form"
```

---

## Phase 6: Stripe Subscriptions

### Task 11: Stripe integration

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/portal/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

**Step 1: Create `src/lib/stripe.ts`**
```ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });

export const STRIPE_PRICES = {
  basic: { priceId: "price_basic_monthly", amount: 2900, name: "Basic", tier: "basic" as const },
  professional: { priceId: "price_pro_monthly", amount: 5900, name: "Professional", tier: "professional" as const },
  elite: { priceId: "price_elite_monthly", amount: 9900, name: "Elite", tier: "elite" as const },
};
```

**Note:** Create the 3 Stripe products/prices in the Stripe dashboard (test mode) and update the priceIds above.

**Step 2: Checkout route — creates Stripe Checkout session**
```ts
// POST /api/stripe/checkout
// Body: { tier: "basic" | "professional" | "elite", professionalId }
// Creates/reuses Stripe customer, returns checkout URL
```

**Step 3: Portal route — redirects to Stripe Customer Portal**
```ts
// POST /api/stripe/portal
// Returns portal URL for managing subscription
```

**Step 4: Webhook route**
```ts
// POST /api/stripe/webhook
// Handles:
// - checkout.session.completed → set subscription active
// - invoice.payment_succeeded → extend period end
// - invoice.payment_failed → set past_due
// - customer.subscription.deleted → set canceled
```

**Step 5: Pricing page at `/pricing`**
- 3 tier cards: Basic $29, Professional $59, Elite $99
- Feature comparison list
- "Get Started" → Stripe Checkout

**Step 6: Commit**
```bash
git add .
git commit -m "feat: Stripe subscription checkout, portal, and webhook handler"
```

---

## Phase 7: Dashboards

### Task 12: Professional dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/profile/page.tsx`
- Create: `src/app/dashboard/portfolio/page.tsx`
- Create: `src/app/dashboard/subscription/page.tsx`

**Step 1: Dashboard layout with sidebar nav**

**Step 2: Overview page** — subscription status banner (active/past_due/inactive), profile completeness progress bar, quick stats (views, reviews), application status badge.

**Step 3: Profile editor** — edit all profile fields including city/ZIP (auto-geocodes), service radius slider, categories multi-select, specialties textarea.

**Step 4: Portfolio manager** — UploadThing multi-upload, drag-to-reorder, delete images, shows remaining image slots based on tier.

**Step 5: Subscription page** — current plan info + "Manage Billing" → Stripe portal + upgrade options.

**Step 6: Commit**
```bash
git add .
git commit -m "feat: professional dashboard with profile, portfolio, subscription management"
```

---

### Task 13: Admin dashboard

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/applications/page.tsx`
- Create: `src/app/admin/professionals/page.tsx`
- Create: `src/app/admin/reviews/page.tsx`
- Create: `src/app/admin/blog/page.tsx`
- Create: `src/app/api/admin/applications/route.ts`
- Create: `src/app/api/admin/professionals/route.ts`
- Create: `src/app/api/admin/reviews/route.ts`
- Create: `src/app/api/admin/blog/route.ts`

**Step 1: Admin layout** — sidebar with counts (pending applications, pending reviews).

**Step 2: Stats overview** — cards: total professionals, active subscriptions, pending applications, monthly revenue estimate.

**Step 3: Applications queue**
- Table: name, city, categories, submitted date
- "Preview" → opens professional profile in modal
- "Approve" → sets status=approved, creates active subscription record
- "Reject" → sets status=rejected, adds notes
- Tabs: Pending / Approved / Rejected

**Step 4: Professionals management**
- Table with search, filter by status/tier
- Edit profile inline
- Suspend / reactivate
- View subscription status

**Step 5: Reviews moderation**
- Pending reviews table
- Approve / reject each review
- Shows which professional it's for

**Step 6: Blog management**
- List posts (published/draft)
- Create/edit post with rich textarea
- Publish/unpublish toggle

**Step 7: Commit**
```bash
git add .
git commit -m "feat: admin dashboard with applications, moderation, and blog management"
```

---

## Phase 8: SEO Pages

### Task 14: Category and city landing pages

**Files:**
- Create: `src/app/categories/[slug]/page.tsx`
- Create: `src/app/cities/[slug]/page.tsx`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`

**Step 1: Category page** — headline "Best [Category] Professionals", description, grid of top 8 professionals in that category, link to full search.

**Step 2: City page** — "Boudoir Photographers in [City]", top professionals in that city, nearby cities list, SEO-optimized metadata.

**Step 3: Blog index** — grid of blog post cards with cover image, title, excerpt, date.

**Step 4: Blog article** — full article with cover image, formatted body, author, date, related posts.

**Step 5: Add `generateMetadata` to all public pages for SEO**

**Step 6: Add `sitemap.ts` and `robots.ts`**

**Step 7: Commit**
```bash
git add .
git commit -m "feat: SEO landing pages for categories, cities, and blog"
```

---

## Phase 9: Polish

### Task 15: UploadThing integration + final env

**Files:**
- Create: `src/app/api/uploadthing/route.ts`, `src/lib/uploadthing.ts`

**Step 1: Configure UploadThing router**
```ts
import { createUploadthing } from "uploadthing/next";
const f = createUploadthing();
export const ourFileRouter = {
  portfolioImage: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      // verify auth
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
};
```

**Step 2: Final `.env` additions**
```
NEXTAUTH_SECRET=<generated in task 4>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<your-admin-password>
```

**Step 3: Commit**
```bash
git add .
git commit -m "feat: complete UploadThing integration for portfolio images"
```

---

### Task 16: Final run and verification

**Step 1: Run dev server**
```bash
npm run dev
```

**Step 2: Verify these routes work:**
- `http://localhost:3000` — homepage loads with featured professionals
- `http://localhost:3000/search?q=velvet` — returns matching professionals
- `http://localhost:3000/search?lat=30.45&lng=-91.19&radius=50` — returns Baton Rouge area pros
- `http://localhost:3000/professionals/velvet-rose-boudoir-0` — profile loads
- `http://localhost:3000/admin` (as admin@example.com / <your-admin-password>)
- `http://localhost:3000/join` — application form
- `http://localhost:3000/blog` — blog loads
- `http://localhost:3000/categories/boudoir-photographer` — category page
- `http://localhost:3000/cities/new-york` — city page

**Step 3: Final commit**
```bash
git add .
git commit -m "feat: complete directory platform MVP"
```
