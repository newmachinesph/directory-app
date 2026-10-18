import { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const professionals = await sql`SELECT slug, updated_at FROM professionals WHERE status = 'approved' LIMIT 1000`;
  const blogPosts = await sql`SELECT slug, updated_at FROM blog_posts WHERE published_at IS NOT NULL`;
  const categories = await sql`SELECT slug FROM categories`;

  const cities = ["new-york", "los-angeles", "chicago", "houston", "dallas", "atlanta", "miami", "baton-rouge", "nashville", "denver"];

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...categories.map((c: any) => ({ url: `${BASE_URL}/categories/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...cities.map(city => ({ url: `${BASE_URL}/cities/${city}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...(professionals as any[]).map(p => ({ url: `${BASE_URL}/professionals/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...(blogPosts as any[]).map(p => ({ url: `${BASE_URL}/blog/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
