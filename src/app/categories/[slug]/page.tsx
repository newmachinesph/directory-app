import { notFound } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import ProfessionalCard from "@/components/ui/professional-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

const sql = neon(process.env.DATABASE_URL!);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [cat] = await sql`SELECT name, description FROM categories WHERE slug = ${slug}` as any[];
  if (!cat) return { title: "Not Found" };
  return {
    title: `${cat.name} | BoudoirDirectory`,
    description: cat.description || `Find the best vetted ${cat.name.toLowerCase()} professionals on BoudoirDirectory.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cat] = await sql`SELECT * FROM categories WHERE slug = ${slug}` as any[];
  if (!cat) notFound();

  const professionals = await sql`
    SELECT p.id, p.name, p.slug, p.city, p.state, p.tier, p.profile_completeness,
      (SELECT json_agg(json_build_object('url', pi.url, 'caption', pi.caption) ORDER BY pi.sort_order) FROM portfolio_images pi WHERE pi.professional_id = p.id AND pi.is_approved = true LIMIT 1) as cover_images,
      (SELECT json_agg(json_build_object('id', c2.id, 'name', c2.name, 'slug', c2.slug)) FROM categories c2 JOIN professional_categories pc2 ON pc2.category_id = c2.id WHERE pc2.professional_id = p.id) as categories,
      COALESCE((SELECT AVG(r.rating)::numeric(3,1) FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as avg_rating,
      COALESCE((SELECT COUNT(*)::int FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as review_count
    FROM professionals p
    JOIN subscriptions s ON s.professional_id = p.id
    JOIN professional_categories pc ON pc.professional_id = p.id
    WHERE p.status = 'approved' AND s.status = 'active' AND pc.category_id = ${cat.id}
    ORDER BY CASE p.tier WHEN 'elite' THEN 1 WHEN 'professional' THEN 2 ELSE 3 END, p.profile_completeness DESC
    LIMIT 12
  ` as any[];

  const otherCategories = await sql`
    SELECT name, slug FROM categories WHERE id != ${cat.id} ORDER BY sort_order LIMIT 6
  ` as any[];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold mb-3">Best {cat.name} Professionals</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {cat.description || `Discover vetted ${cat.name.toLowerCase()} professionals near you.`}
        </p>
      </div>

      {professionals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
            {professionals.map((pro: any) => <ProfessionalCard key={pro.id} professional={pro} />)}
          </div>
          <div className="text-center">
            <Link href={`/search?category=${slug}`}>
              <Button variant="outline" className="gap-2">View All {cat.name} Professionals <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">No professionals in this category yet.</p>
          <Link href="/search"><Button variant="outline">Browse All Professionals</Button></Link>
        </div>
      )}

      {/* Other categories */}
      {otherCategories.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <h2 className="text-xl font-serif font-semibold mb-4">Browse Other Categories</h2>
          <div className="flex flex-wrap gap-3">
            {otherCategories.map((c: any) => (
              <Link key={c.slug} href={`/categories/${c.slug}`}>
                <Button variant="outline" size="sm">{c.name}</Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
