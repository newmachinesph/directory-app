import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

// Custom PostGIS geography point type
const geography = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

// Enums
export const userRoleEnum = pgEnum("user_role", ["professional", "admin"]);
export const professionalStatusEnum = pgEnum("professional_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "trialing",
  "incomplete",
]);
export const tierEnum = pgEnum("tier", ["basic", "professional", "elite"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("professional"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Professionals table
export const professionals = pgTable(
  "professionals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
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
  },
  (t) => ({
    nameIdx: index("professionals_name_idx").on(t.name),
    slugIdx: uniqueIndex("professionals_slug_idx").on(t.slug),
    statusIdx: index("professionals_status_idx").on(t.status),
    cityIdx: index("professionals_city_idx").on(t.city),
  })
);

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
});

// Professional <-> Category junction
export const professionalCategories = pgTable("professional_categories", {
  professionalId: uuid("professional_id")
    .references(() => professionals.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
});

// Portfolio images
export const portfolioImages = pgTable("portfolio_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id")
    .references(() => professionals.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  professionalId: uuid("professional_id")
    .references(() => professionals.id, { onDelete: "cascade" })
    .notNull(),
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
  professionalId: uuid("professional_id")
    .references(() => professionals.id, { onDelete: "cascade" })
    .notNull(),
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
  professionalId: uuid("professional_id")
    .references(() => professionals.id, { onDelete: "cascade" })
    .notNull(),
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

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Professional = typeof professionals.$inferSelect;
export type NewProfessional = typeof professionals.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
