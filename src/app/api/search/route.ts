import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = (p.get("q") || "").trim();
  const lat = parseFloat(p.get("lat") || "");
  const lng = parseFloat(p.get("lng") || "");
  const radius = Math.min(parseInt(p.get("radius") || "50"), 500); // max 500 miles
  const category = (p.get("category") || "").trim();
  const page = Math.max(1, parseInt(p.get("page") || "1"));
  const limit = 12;
  const offset = (page - 1) * limit;
  const radiusMeters = radius * 1609.34;
  const hasLocation = !isNaN(lat) && !isNaN(lng);
  const hasQuery = q.length > 0;

  try {
    // Build the main query using raw SQL for maximum PostGIS compatibility
    const results = await sql`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.bio,
        p.city,
        p.state,
        p.zip,
        p.tier,
        p.latitude,
        p.longitude,
        p.service_radius_miles,
        p.profile_completeness,
        p.contact_email,
        p.specialties,
        CASE
          WHEN ${hasLocation} AND p.location IS NOT NULL
          THEN ST_Distance(p.location, ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography) / 1609.34
          ELSE NULL
        END as distance_miles,
        (
          SELECT json_agg(
            json_build_object('url', pi.url, 'caption', pi.caption)
            ORDER BY pi.sort_order
          )
          FROM portfolio_images pi
          WHERE pi.professional_id = p.id AND pi.is_approved = true
          LIMIT 1
        ) as cover_images,
        (
          SELECT json_agg(
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          )
          FROM categories c
          JOIN professional_categories pc ON pc.category_id = c.id
          WHERE pc.professional_id = p.id
        ) as categories,
        COALESCE(
          (SELECT AVG(r.rating)::numeric(3,1)
           FROM reviews r
           WHERE r.professional_id = p.id AND r.is_approved = true),
          0
        ) as avg_rating,
        COALESCE(
          (SELECT COUNT(*)::int
           FROM reviews r
           WHERE r.professional_id = p.id AND r.is_approved = true),
          0
        ) as review_count
      FROM professionals p
      JOIN subscriptions s ON s.professional_id = p.id
      WHERE
        p.status = 'approved'
        AND s.status = 'active'
        AND (
          NOT ${hasQuery}
          OR p.search_vector @@ plainto_tsquery('english', ${hasQuery ? q : ""})
          OR similarity(p.name, ${hasQuery ? q : ""}) > 0.15
          OR p.name ILIKE ${'%' + q + '%'}
          OR p.city ILIKE ${'%' + q + '%'}
        )
        AND (
          NOT ${hasLocation}
          OR p.location IS NULL
          OR ST_DWithin(
            p.location,
            ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography,
            ${radiusMeters}
          )
        )
        AND (
          ${category === ""}
          OR EXISTS (
            SELECT 1 FROM professional_categories pc2
            JOIN categories c2 ON c2.id = pc2.category_id
            WHERE pc2.professional_id = p.id AND c2.slug = ${category}
          )
        )
      ORDER BY
        CASE p.tier
          WHEN 'elite' THEN 1
          WHEN 'professional' THEN 2
          ELSE 3
        END ASC,
        CASE
          WHEN ${hasLocation} AND p.location IS NOT NULL
          THEN ST_Distance(p.location, ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography)
          ELSE 0
        END ASC,
        p.profile_completeness DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Count query for pagination
    const countResult = await sql`
      SELECT COUNT(p.id)::int as total
      FROM professionals p
      JOIN subscriptions s ON s.professional_id = p.id
      WHERE
        p.status = 'approved'
        AND s.status = 'active'
        AND (
          NOT ${hasQuery}
          OR p.search_vector @@ plainto_tsquery('english', ${hasQuery ? q : ""})
          OR similarity(p.name, ${hasQuery ? q : ""}) > 0.15
          OR p.name ILIKE ${'%' + q + '%'}
          OR p.city ILIKE ${'%' + q + '%'}
        )
        AND (
          NOT ${hasLocation}
          OR p.location IS NULL
          OR ST_DWithin(
            p.location,
            ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography,
            ${radiusMeters}
          )
        )
        AND (
          ${category === ""}
          OR EXISTS (
            SELECT 1 FROM professional_categories pc2
            JOIN categories c2 ON c2.id = pc2.category_id
            WHERE pc2.professional_id = p.id AND c2.slug = ${category}
          )
        )
    `;

    const total = (countResult[0] as any)?.total ?? 0;

    return NextResponse.json({
      results: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
