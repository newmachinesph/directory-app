import { notFound } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import ProfessionalCard from "@/components/ui/professional-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";

const sql = neon(process.env.DATABASE_URL!);

// City slug to display name mapping
const CITY_MAP: Record<string, { name: string; state: string }> = {
  "new-york": { name: "New York", state: "NY" },
  "los-angeles": { name: "Los Angeles", state: "CA" },
  "chicago": { name: "Chicago", state: "IL" },
  "houston": { name: "Houston", state: "TX" },
  "dallas": { name: "Dallas", state: "TX" },
  "atlanta": { name: "Atlanta", state: "GA" },
  "miami": { name: "Miami", state: "FL" },
  "baton-rouge": { name: "Baton Rouge", state: "LA" },
  "nashville": { name: "Nashville", state: "TN" },
  "denver": { name: "Denver", state: "CO" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = CITY_MAP[slug];
  if (!city) return { title: "Not Found" };
  return {
    title: `Boudoir Professionals in ${city.name} | BoudoirDirectory`,
    description: `Find vetted boudoir photographers and professionals in ${city.name}, ${city.state}. Browse portfolios, read reviews, and book your session.`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cityInfo = CITY_MAP[slug];
  if (!cityInfo) notFound();

  const professionals = await sql`
    SELECT p.id, p.name, p.slug, p.city, p.state, p.tier, p.profile_completeness,
      (SELECT json_agg(json_build_object('url', pi.url, 'caption', pi.caption) ORDER BY pi.sort_order) FROM portfolio_images pi WHERE pi.professional_id = p.id AND pi.is_approved = true LIMIT 1) as cover_images,
      (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)) FROM categories c JOIN professional_categories pc ON pc.category_id = c.id WHERE pc.professional_id = p.id) as categories,
      COALESCE((SELECT AVG(r.rating)::numeric(3,1) FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as avg_rating,
      COALESCE((SELECT COUNT(*)::int FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as review_count
    FROM professionals p
    JOIN subscriptions s ON s.professional_id = p.id
    WHERE p.status = 'approved' AND s.status = 'active'
      AND (p.city ILIKE ${cityInfo.name} OR p.state ILIKE ${cityInfo.state})
    ORDER BY CASE p.tier WHEN 'elite' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END, p.profile_completeness DESC
    LIMIT 12
  ` as any[];

  const nearbyCities = Object.entries(CITY_MAP)
    .filter(([s]) => s !== slug)
    .slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span>{cityInfo.name}, {cityInfo.state}</span>
        </div>
        <h1 className="text-4xl font-serif font-bold mb-3">
          Boudoir Professionals in {cityInfo.name}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find vetted boudoir photographers, makeup artists, and styling professionals in {cityInfo.name}. All professionals are manually reviewed before listing.
        </p>
      </div>

      {professionals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {professionals.map((pro: any) => <ProfessionalCard key={pro.id} professional={pro} />)}
          </div>
          <div className="text-center">
            <Link href={`/search?location=${encodeURIComponent(cityInfo.name + ", " + cityInfo.state)}&radius=50`}>
              <Button variant="outline" className="gap-2">See More Near {cityInfo.name} <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">No professionals in {cityInfo.name} yet.</p>
          <Link href="/search"><Button variant="outline">Browse All Professionals</Button></Link>
        </div>
      )}

      <div className="mt-16 pt-8 border-t">
        <h2 className="text-xl font-serif font-semibold mb-4">Browse Other Cities</h2>
        <div className="flex flex-wrap gap-3">
          {nearbyCities.map(([slug, city]) => (
            <Link key={slug} href={`/cities/${slug}`}>
              <Button variant="outline" size="sm">{city.name}, {city.state}</Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
