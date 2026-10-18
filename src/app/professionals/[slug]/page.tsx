import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { neon } from "@neondatabase/serverless";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, Globe, Phone, Mail, ArrowLeft } from "lucide-react";
import ReviewSection from "./ReviewSection";
import ContactForm from "./ContactForm";
import type { Metadata } from "next";

const sql = neon(process.env.DATABASE_URL!);

async function getProfessional(slug: string) {
  const result = await sql`
    SELECT
      p.*,
      (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'caption', pi.caption) ORDER BY pi.sort_order)
       FROM portfolio_images pi WHERE pi.professional_id = p.id AND pi.is_approved = true) as images,
      (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
       FROM categories c JOIN professional_categories pc ON pc.category_id = c.id WHERE pc.professional_id = p.id) as categories,
      (SELECT json_agg(json_build_object('id', r.id, 'reviewer_name', r.reviewer_name, 'rating', r.rating, 'body', r.body, 'created_at', r.created_at) ORDER BY r.created_at DESC)
       FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true) as reviews,
      COALESCE((SELECT AVG(r.rating)::numeric(3,1) FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as avg_rating,
      COALESCE((SELECT COUNT(*)::int FROM reviews r WHERE r.professional_id = p.id AND r.is_approved = true), 0) as review_count
    FROM professionals p
    JOIN subscriptions s ON s.professional_id = p.id
    WHERE p.slug = ${slug} AND p.status = 'approved' AND s.status = 'active'
    LIMIT 1
  `;
  return result[0] as any || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pro = await getProfessional(slug);
  if (!pro) return { title: "Not Found" };
  return {
    title: `${pro.name} | BoudoirDirectory`,
    description: pro.bio?.slice(0, 160) || `${pro.name} — boudoir professional in ${pro.city}, ${pro.state}`,
  };
}

const TIER_LABELS = {
  elite: { label: "Elite Member", className: "bg-yellow-500 text-white" },
  professional: { label: "Pro Member", className: "bg-blue-500 text-white" },
  basic: { label: "Member", className: "bg-gray-200 text-gray-700" },
};

export default async function ProfessionalProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pro = await getProfessional(slug);
  if (!pro) notFound();

  const images: any[] = pro.images || [];
  const categories: any[] = pro.categories || [];
  const reviews: any[] = pro.reviews || [];
  const rating = parseFloat(pro.avg_rating) || 0;
  const tierConfig = TIER_LABELS[pro.tier as keyof typeof TIER_LABELS];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back button */}
      <Link href="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h1 className="text-3xl font-serif font-bold">{pro.name}</h1>
              <Badge className={tierConfig.className}>{tierConfig.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {(pro.city || pro.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[pro.city, pro.state].filter(Boolean).join(", ")}
                  {pro.service_radius_miles && ` · Serves within ${pro.service_radius_miles} miles`}
                </span>
              )}
              {rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)} ({pro.review_count} reviews)
                </span>
              )}
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map((cat: any) => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">{cat.name}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio gallery */}
          {images.length > 0 && (
            <div>
              <h2 className="text-xl font-serif font-semibold mb-4">Portfolio</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img: any, idx: number) => (
                  <div key={img.id} className={`relative overflow-hidden rounded-lg bg-muted ${idx === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:h-80" : "aspect-square"}`}>
                    <Image
                      src={img.url}
                      alt={img.caption || `${pro.name} portfolio`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {pro.bio && (
            <div>
              <h2 className="text-xl font-serif font-semibold mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{pro.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {pro.specialties && (
            <div>
              <h2 className="text-xl font-serif font-semibold mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {pro.specialties.split(",").map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Reviews */}
          <ReviewSection
            professionalId={pro.id}
            reviews={reviews}
            avgRating={rating}
            reviewCount={pro.review_count}
          />
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">
          {/* Contact card */}
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Get in Touch</h3>

              {pro.contact_email && (
                <a href={`mailto:${pro.contact_email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {pro.contact_email}
                </a>
              )}
              {pro.contact_phone && (
                <a href={`tel:${pro.contact_phone}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {pro.contact_phone}
                </a>
              )}
              {pro.website && (
                <a href={pro.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Visit Website
                </a>
              )}

              <Separator />
              <ContactForm professionalId={pro.id} professionalName={pro.name} />
            </CardContent>
          </Card>

          {/* Service area */}
          {(pro.city || pro.service_radius_miles) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Service Area</h3>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{[pro.city, pro.state].filter(Boolean).join(", ")}</div>
                    {pro.service_radius_miles && <div className="mt-0.5">Travels within {pro.service_radius_miles} miles</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
