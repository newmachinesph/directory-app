import { neon } from "@neondatabase/serverless";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import ReviewModerationActions from "./ReviewModerationActions";

const sql = neon(process.env.DATABASE_URL!);

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ approved?: string }> }) {
  const { approved } = await searchParams;
  const showApproved = approved === "true";

  const reviews = await sql`
    SELECT r.id, r.reviewer_name, r.rating, r.body, r.is_approved, r.created_at,
      p.name as professional_name, p.slug as professional_slug
    FROM reviews r
    JOIN professionals p ON p.id = r.professional_id
    WHERE r.is_approved = ${showApproved}
    ORDER BY r.created_at DESC
    LIMIT 100
  `;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">Reviews</h1>
      <div className="flex gap-2">
        <a href="/admin/reviews" className={`px-4 py-2 rounded-lg text-sm font-medium ${!showApproved ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Pending</a>
        <a href="/admin/reviews?approved=true" className={`px-4 py-2 rounded-lg text-sm font-medium ${showApproved ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Approved</a>
      </div>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {showApproved ? "approved" : "pending"} reviews.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{r.reviewer_name}</span>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>
                      <span className="text-xs text-muted-foreground">for {r.professional_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  {!showApproved && <ReviewModerationActions reviewId={r.id} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
