import { neon } from "@neondatabase/serverless";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const sql = neon(process.env.DATABASE_URL!);

export default async function AdminOverviewPage() {
  const stats = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM professionals WHERE status = 'pending') as pending_applications,
      (SELECT COUNT(*)::int FROM professionals WHERE status = 'approved') as approved_professionals,
      (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active') as active_subscriptions,
      (SELECT COUNT(*)::int FROM reviews WHERE is_approved = false) as pending_reviews,
      (SELECT COUNT(*)::int FROM professionals) as total_professionals,
      (SELECT COUNT(*)::int FROM blog_posts WHERE published_at IS NOT NULL) as published_posts
  `;
  const s = stats[0] as any;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold">Admin Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Pending Applications", value: s.pending_applications, href: "/admin/applications", urgent: s.pending_applications > 0 },
          { label: "Approved Professionals", value: s.approved_professionals, href: "/admin/professionals" },
          { label: "Active Subscriptions", value: s.active_subscriptions, href: "/admin/professionals" },
          { label: "Pending Reviews", value: s.pending_reviews, href: "/admin/reviews", urgent: s.pending_reviews > 0 },
          { label: "Total Professionals", value: s.total_professionals, href: "/admin/professionals" },
          { label: "Blog Posts", value: s.published_posts, href: "/admin/blog" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${stat.urgent ? "border-orange-300 bg-orange-50" : ""}`}>
              <CardContent className="p-4">
                <div className={`text-3xl font-bold ${stat.urgent ? "text-orange-600" : ""}`}>{stat.value}</div>
                <div className={`text-sm mt-1 ${stat.urgent ? "text-orange-700" : "text-muted-foreground"}`}>{stat.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
