import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { professionals, professionalCategories, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await sql`
    SELECT p.*,
      (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
       FROM categories c JOIN professional_categories pc ON pc.category_id = c.id WHERE pc.professional_id = p.id) as categories
    FROM professionals p WHERE p.user_id = ${session.user.id} LIMIT 1
  `;
  return NextResponse.json({ professional: result[0] || null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pro] = await db.select({ id: professionals.id }).from(professionals)
    .where(eq(professionals.userId, session.user.id));
  if (!pro) return NextResponse.json({ error: "No profile found" }, { status: 404 });

  const body = await req.json();
  const { name, bio, specialties, website, contactPhone, contactEmail, city, state, zip, serviceRadiusMiles, selectedCategories } = body;

  // Geocode if location changed
  let lat: number | null = null;
  let lng: number | null = null;
  if (city && state) {
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${city}, ${state} ${zip || ""}`)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData.results?.[0]) {
        lat = geoData.results[0].geometry.location.lat;
        lng = geoData.results[0].geometry.location.lng;
      }
    } catch {}
  }

  // Calculate completeness
  const completeness = [name, bio, specialties, city, contactEmail || contactPhone, website].filter(Boolean).length;
  const profileCompleteness = Math.round((completeness / 6) * 100);

  await db.update(professionals).set({
    name, bio, specialties,
    website: website || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
    city, state, zip: zip || null,
    serviceRadiusMiles: serviceRadiusMiles || 50,
    latitude: lat, longitude: lng,
    profileCompleteness,
    updatedAt: new Date(),
  }).where(eq(professionals.id, pro.id));

  // Update PostGIS location
  if (lat && lng) {
    await sql`UPDATE professionals SET location = ST_MakePoint(${lng}, ${lat})::geography WHERE id = ${pro.id}`;
    await sql`UPDATE professionals SET search_vector = to_tsvector('english', ${name || ''} || ' ' || COALESCE(${bio || ''}, '') || ' ' || COALESCE(${city || ''}, '') || ' ' || COALESCE(${state || ''}, '')) WHERE id = ${pro.id}`;
  }

  // Update categories
  if (selectedCategories) {
    await db.delete(professionalCategories).where(eq(professionalCategories.professionalId, pro.id));
    const catRecords = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
    const catMap = new Map(catRecords.map(c => [c.slug, c.id]));
    const vals = selectedCategories.filter((s: string) => catMap.has(s))
      .map((s: string) => ({ professionalId: pro.id, categoryId: catMap.get(s)! }));
    if (vals.length > 0) await db.insert(professionalCategories).values(vals);
  }

  return NextResponse.json({ success: true });
}
