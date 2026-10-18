import Link from "next/link";
import Image from "next/image";
import { neon } from "@neondatabase/serverless";
import SearchBar from "@/components/search/SearchBar";
import ProfessionalCard from "@/components/ui/professional-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, MapPin, Star, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const sql = neon(process.env.DATABASE_URL!);

const CATEGORIES = [
  { name: "Photographers", slug: "boudoir-photographer", icon: "📸" },
  { name: "Makeup Artists", slug: "makeup-artist", icon: "💄" },
  { name: "Hair Stylists", slug: "hair-stylist", icon: "✂️" },
  { name: "Wardrobe Stylists", slug: "wardrobe-stylist", icon: "👗" },
  { name: "Lingerie Boutiques", slug: "lingerie-boutique", icon: "🌸" },
  { name: "Photo Retouchers", slug: "photo-retoucher", icon: "🎨" },
];

const CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Dallas",
  "Atlanta", "Miami", "Nashville", "Denver", "Baton Rouge",
];

async function getFeaturedProfessionals() {
  const results = await sql`
    SELECT
      p.id, p.name, p.slug, p.city, p.state, p.tier, p.profile_completeness,
      (SELECT json_agg(json_build_object('url', pi.url, 'caption', pi.caption) ORDER BY pi.sort_order)
       FROM portfolio_images pi WHERE pi.professional_id = p.id AND pi.is_approved = true LIMIT 1) as cover_images,
      (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
       FROM categories c JOIN professional_categories pc ON pc.category_id = c.id WHERE pc.professional_id = p.id) as categories,
      COALESCE((SELECT AVG(r.rating)::numeric(3,1) FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as avg_rating,
      COALESCE((SELECT COUNT(*)::int FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as review_count
    FROM professionals p
    JOIN subscriptions s ON s.professional_id = p.id
    WHERE p.status = 'approved' AND s.status = 'active' AND p.tier = 'elite'
    ORDER BY p.profile_completeness DESC
    LIMIT 6
  `;
  return results as any[];
}

async function getStats() {
  const result = await sql`
    SELECT
      (SELECT COUNT(*) FROM professionals WHERE status = 'approved') as total_pros,
      (SELECT COUNT(DISTINCT city) FROM professionals WHERE status = 'approved') as total_cities,
      (SELECT COUNT(*) FROM reviews WHERE is_approved = true) as total_reviews
  `;
  return result[0] as any;
}

async function getRecentBlogPosts() {
  const posts = await sql`
    SELECT id, title, slug, excerpt, cover_image, author, published_at
    FROM blog_posts
    WHERE published_at IS NOT NULL
    ORDER BY published_at DESC
    LIMIT 3
  `;
  return posts as any[];
}

export default async function HomePage() {
  const [featured, stats, blogPosts] = await Promise.all([
    getFeaturedProfessionals(),
    getStats(),
    getRecentBlogPosts(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-rose-50 via-background to-background py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1">
            ✨ Fully Vetted Professionals
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">
            Find Your Perfect{" "}
            <span className="text-primary">Boudoir Professional</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover vetted boudoir photographers, makeup artists, and styling professionals in your area.
          </p>
          <div className="bg-background/80 backdrop-blur rounded-2xl p-4 shadow-lg border">
            <SearchBar size="large" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-2xl font-bold">{stats?.total_pros || 50}+</div>
              <div className="text-sm text-muted-foreground">Vetted Professionals</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.total_cities || 10}+</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.total_reviews || 100}+</div>
              <div className="text-sm text-muted-foreground">Verified Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Manually Approved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-serif font-semibold text-center mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer text-center">
                  <CardContent className="p-4">
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="text-sm font-medium">{cat.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured professionals */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-muted/20">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif font-semibold">Featured Professionals</h2>
                <p className="text-muted-foreground mt-1">Our top-rated elite members</p>
              </div>
              <Link href="/search">
                <Button variant="ghost" className="gap-2">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* City links */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-serif font-semibold text-center mb-8">Browse by City</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/cities/${city.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-4 py-2 border rounded-full text-sm hover:border-primary hover:text-primary transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-serif font-semibold text-center mb-10">Why Choose BoudoirDirectory?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Manually Vetted</h3>
              <p className="text-sm text-muted-foreground">Every professional is reviewed by our team before appearing in the directory.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Reviews</h3>
              <p className="text-sm text-muted-foreground">All reviews are moderated to ensure authenticity and helpfulness.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Location Search</h3>
              <p className="text-sm text-muted-foreground">Find professionals near you with radius search down to 10 miles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      {blogPosts.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-semibold">From the Blog</h2>
              <Link href="/blog"><Button variant="ghost" className="gap-2">All posts <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    {post.cover_image && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image src={post.cover_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA for professionals */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Are You a Boudoir Professional?</h2>
          <p className="text-primary-foreground/80 mb-8">Join our vetted directory and connect with clients actively looking for your services.</p>
          <Link href="/join">
            <Button variant="secondary" size="lg" className="font-semibold">
              Apply to Join <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
