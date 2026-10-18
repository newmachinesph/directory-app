import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfessionalCardProps {
  professional: {
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    state?: string | null;
    tier: "basic" | "professional" | "elite";
    avg_rating?: number | string | null;
    review_count?: number | null;
    distance_miles?: number | null;
    cover_images?: Array<{ url: string; caption: string }> | null;
    categories?: Array<{ id: string; name: string; slug: string }> | null;
    specialties?: string | null;
  };
}

const TIER_CONFIG = {
  elite: { label: "Elite", className: "bg-yellow-500 text-white border-yellow-500" },
  professional: { label: "Pro", className: "bg-blue-500 text-white border-blue-500" },
  basic: { label: "", className: "" },
};

export default function ProfessionalCard({ professional: p }: ProfessionalCardProps) {
  const coverUrl = p.cover_images?.[0]?.url || `https://picsum.photos/seed/${p.slug}/400/500`;
  const rating = typeof p.avg_rating === "string" ? parseFloat(p.avg_rating) : (p.avg_rating ?? 0);
  const tier = TIER_CONFIG[p.tier];

  return (
    <Link href={`/professionals/${p.slug}`} className="group block">
      <Card className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        p.tier === "elite" && "ring-1 ring-yellow-400/50"
      )}>
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <Image
            src={coverUrl}
            alt={p.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {tier.label && (
            <div className="absolute top-2 right-2">
              <Badge className={cn("text-xs font-semibold", tier.className)}>
                {tier.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-base leading-tight truncate">{p.name}</h3>

          {(p.city || p.state) && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{[p.city, p.state].filter(Boolean).join(", ")}</span>
              {p.distance_miles != null && (
                <span className="ml-1 text-xs">· {Math.round(p.distance_miles)} mi</span>
              )}
            </div>
          )}

          {p.categories && p.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {p.categories.slice(0, 2).map((cat) => (
                <span key={cat.id} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {(rating > 0 || (p.review_count ?? 0) > 0) && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating > 0 ? rating.toFixed(1) : "–"}</span>
              {(p.review_count ?? 0) > 0 && (
                <span className="text-muted-foreground">({p.review_count})</span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
