"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  body: string;
  created_at: string;
}

interface ReviewSectionProps {
  professionalId: string;
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
}

export default function ReviewSection({ professionalId, reviews, avgRating, reviewCount }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", rating: 5, body: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, reviewerName: form.name, reviewerEmail: form.email, rating: form.rating, body: form.body }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setShowForm(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-semibold">Reviews</h2>
        {!submitted && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Write a Review"}
          </Button>
        )}
      </div>

      {avgRating > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl font-bold">{avgRating.toFixed(1)}</span>
          <div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={cn("h-4 w-4", s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</div>
          </div>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-800">
          Thank you! Your review has been submitted and will appear after approval.
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Your Name *</Label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane D." />
                </div>
                <div className="space-y-1">
                  <Label>Email (optional)</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Rating *</Label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onMouseEnter={() => setHoveredStar(s)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setForm({...form, rating: s})}>
                      <Star className={cn("h-6 w-6 transition-colors", s <= (hoveredStar || form.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Review *</Label>
                <Textarea required minLength={20} value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Share your experience (min 20 characters)..." rows={4} />
              </div>
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Review"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to leave a review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{review.reviewer_name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn("h-3.5 w-3.5", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
