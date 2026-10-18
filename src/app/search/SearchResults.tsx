import SearchBar from "@/components/search/SearchBar";
import ProfessionalCard from "@/components/ui/professional-card";
import CategoryFilter from "./CategoryFilter";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const sql = neon(process.env.DATABASE_URL!);

interface SearchResultsProps {
  searchParams: Record<string, string>;
}

async function fetchCategories() {
  return sql`SELECT id, name, slug FROM categories ORDER BY sort_order`;
}

export default async function SearchResults({ searchParams }: SearchResultsProps) {
  const q = searchParams.q || "";
  const lat = parseFloat(searchParams.lat || "");
  const lng = parseFloat(searchParams.lng || "");
  const radius = parseInt(searchParams.radius || "50");
  const category = searchParams.category || "";
  const location = searchParams.location || "";
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const limit = 12;

  // Build search URL
  const apiParams = new URLSearchParams();
  if (q) apiParams.set("q", q);
  if (!isNaN(lat)) apiParams.set("lat", lat.toString());
  if (!isNaN(lng)) apiParams.set("lng", lng.toString());
  if (radius) apiParams.set("radius", radius.toString());
  if (category) apiParams.set("category", category);
  apiParams.set("page", page.toString());

  // Direct DB query (same logic as API route but server-side for performance)
  const hasQuery = q.length > 0;
  const hasLocation = !isNaN(lat) && !isNaN(lng);
  const radiusMeters = radius * 1609.34;
  const offset = (page - 1) * limit;

  const [results, countResult, allCategories] = await Promise.all([
    sql`
      SELECT
        p.id, p.name, p.slug, p.bio, p.city, p.state, p.tier,
        p.latitude, p.longitude, p.service_radius_miles, p.profile_completeness,
        CASE
          WHEN ${hasLocation} AND p.location IS NOT NULL
          THEN ST_Distance(p.location, ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography) / 1609.34
          ELSE NULL
        END as distance_miles,
        (SELECT json_agg(json_build_object('url', pi.url, 'caption', pi.caption) ORDER BY pi.sort_order)
         FROM portfolio_images pi WHERE pi.professional_id = p.id AND pi.is_approved = true LIMIT 1) as cover_images,
        (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
         FROM categories c JOIN professional_categories pc ON pc.category_id = c.id WHERE pc.professional_id = p.id) as categories,
        COALESCE((SELECT AVG(r.rating)::numeric(3,1) FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as avg_rating,
        COALESCE((SELECT COUNT(*)::int FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as review_count
      FROM professionals p
      JOIN subscriptions s ON s.professional_id = p.id
      WHERE p.status = 'approved' AND s.status = 'active'
        AND (NOT ${hasQuery} OR p.search_vector @@ plainto_tsquery('english', ${hasQuery ? q : ""}) OR similarity(p.name, ${hasQuery ? q : ""}) > 0.15 OR p.name ILIKE ${'%' + q + '%'} OR p.city ILIKE ${'%' + q + '%'})
        AND (NOT ${hasLocation} OR p.location IS NULL OR ST_DWithin(p.location, ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography, ${radiusMeters}))
        AND (${category === ""} OR EXISTS (SELECT 1 FROM professional_categories pc2 JOIN categories c2 ON c2.id = pc2.category_id WHERE pc2.professional_id = p.id AND c2.slug = ${category}))
      ORDER BY
        CASE p.tier WHEN 'elite' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END,
        CASE WHEN ${hasLocation} AND p.location IS NOT NULL THEN ST_Distance(p.location, ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography) ELSE 0 END,
        p.profile_completeness DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(p.id)::int as total
      FROM professionals p JOIN subscriptions s ON s.professional_id = p.id
      WHERE p.status = 'approved' AND s.status = 'active'
        AND (NOT ${hasQuery} OR p.search_vector @@ plainto_tsquery('english', ${hasQuery ? q : ""}) OR similarity(p.name, ${hasQuery ? q : ""}) > 0.15 OR p.name ILIKE ${'%' + q + '%'} OR p.city ILIKE ${'%' + q + '%'})
        AND (NOT ${hasLocation} OR p.location IS NULL OR ST_DWithin(p.location, ST_MakePoint(${hasLocation ? lng : 0}, ${hasLocation ? lat : 0})::geography, ${radiusMeters}))
        AND (${category === ""} OR EXISTS (SELECT 1 FROM professional_categories pc2 JOIN categories c2 ON c2.id = pc2.category_id WHERE pc2.professional_id = p.id AND c2.slug = ${category}))
    `,
    fetchCategories(),
  ]);

  const total = (countResult[0] as any)?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Build heading
  let heading = "All Professionals";
  if (q && location) heading = `Results for "${q}" near ${location}`;
  else if (q) heading = `Results for "${q}"`;
  else if (location) heading = `Professionals near ${location}`;

  function buildPageUrl(p: number) {
    const ps = new URLSearchParams(searchParams);
    ps.set("page", p.toString());
    return `/search?${ps.toString()}`;
  }

  return (
    <div>
      {/* Search bar at top */}
      <div className="mb-6">
        <SearchBar
          defaultQuery={q}
          defaultLocation={location}
          defaultRadius={radius}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 shrink-0">
          <CategoryFilter
            categories={allCategories as any[]}
            selectedCategory={category}
            searchParams={searchParams}
          />
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">{heading}</h1>
            <span className="text-sm text-muted-foreground">{total} result{total !== 1 ? "s" : ""}</span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No professionals found matching your search.</p>
              <Link href="/search"><Button variant="outline">Clear filters</Button></Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map((pro: any) => (
                  <ProfessionalCard key={pro.id} professional={pro} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildPageUrl(page - 1)}>
                      <Button variant="outline" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={buildPageUrl(page + 1)}>
                      <Button variant="outline" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
