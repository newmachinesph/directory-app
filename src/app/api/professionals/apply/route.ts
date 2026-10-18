import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { professionals, applications, professionalCategories, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, specialties, categories: catSlugs, website, contactPhone, city, state, zip, serviceRadius, tier } = body;

  if (!name || !city || !state) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate slug
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

  // Geocode the location
  let lat: number | null = null;
  let lng: number | null = null;
  try {
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${city}, ${state} ${zip}`)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (geoData.results?.[0]) {
      lat = geoData.results[0].geometry.location.lat;
      lng = geoData.results[0].geometry.location.lng;
    }
  } catch {}

  // Create professional profile
  const [pro] = await db.insert(professionals).values({
    userId: session.user.id,
    name,
    slug: uniqueSlug,
    bio,
    specialties,
    website,
    contactPhone,
    city,
    state,
    zip,
    latitude: lat,
    longitude: lng,
    serviceRadiusMiles: serviceRadius || 50,
    status: "pending",
    tier: tier || "basic",
    contactEmail: session.user.email ?? undefined,
    profileCompleteness: 70,
  }).returning();

  // Update PostGIS location if we have coordinates
  if (lat && lng) {
    await sql`UPDATE professionals SET location = ST_MakePoint(${lng}, ${lat})::geography WHERE id = ${pro.id}`;
    await sql`UPDATE professionals SET search_vector = to_tsvector('english', ${name} || ' ' || COALESCE(${bio}, '') || ' ' || ${city} || ' ' || ${state}) WHERE id = ${pro.id}`;
  }

  // Associate categories
  if (catSlugs && catSlugs.length > 0) {
    const catRecords = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
    const catMap = new Map(catRecords.map(c => [c.slug, c.id]));
    const catValues = catSlugs
      .filter((s: string) => catMap.has(s))
      .map((s: string) => ({ professionalId: pro.id, categoryId: catMap.get(s)! }));
    if (catValues.length > 0) {
      await db.insert(professionalCategories).values(catValues);
    }
  }

  // Create application record
  await db.insert(applications).values({
    professionalId: pro.id,
    status: "pending",
  });

  return NextResponse.json({ professionalId: pro.id });
}
