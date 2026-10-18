import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { professionals, subscriptions, reviews, applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Star } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [pro] = await db.select().from(professionals).where(eq(professionals.userId, session.user.id));

  if (!pro) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-3">No Profile Found</h1>
        <p className="text-muted-foreground mb-6">You haven&apos;t applied to the directory yet.</p>
        <Link href="/join"><Button>Apply Now</Button></Link>
      </div>
    );
  }

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.professionalId, pro.id));
  const reviewCount = await db.$count(reviews, eq(reviews.professionalId, pro.id));
  const [app] = await db.select().from(applications).where(eq(applications.professionalId, pro.id));

  const statusConfig = {
    approved: { label: "Approved", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    pending: { label: "Pending Review", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
    rejected: { label: "Rejected", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
    suspended: { label: "Suspended", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  };
  const statusInfo = statusConfig[pro.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {pro.name}</p>
      </div>

      {/* Status banner */}
      <div className={`border rounded-lg p-4 flex items-center gap-3 ${statusInfo.bg}`}>
        <StatusIcon className={`h-5 w-5 shrink-0 ${statusInfo.color}`} />
        <div>
          <div className={`font-semibold text-sm ${statusInfo.color}`}>Listing Status: {statusInfo.label}</div>
          {pro.status === "pending" && <p className="text-xs text-muted-foreground mt-0.5">Your application is under review. We&apos;ll notify you once approved.</p>}
          {pro.status === "approved" && sub?.status !== "active" && <p className="text-xs text-muted-foreground mt-0.5">Your subscription is not active. Your listing is hidden.</p>}
          {pro.status === "approved" && sub?.status === "active" && <p className="text-xs text-muted-foreground mt-0.5">Your listing is live and visible in search results.</p>}
        </div>
      </div>

      {/* Subscription warning */}
      {sub && sub.status !== "active" && sub.status !== "incomplete" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">Subscription issue: {sub.status}</p>
          <p className="text-xs text-red-600 mt-1">Your listing is hidden until payment is resolved.</p>
          <Link href="/dashboard/subscription"><Button size="sm" variant="destructive" className="mt-2">Fix Subscription</Button></Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{pro.tier === "elite" ? "★" : pro.tier === "professional" ? "↑" : "—"}</div>
            <div className="text-xs text-muted-foreground capitalize">{pro.tier} Tier</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{pro.profileCompleteness}%</div>
            <div className="text-xs text-muted-foreground">Profile Complete</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />{reviewCount}</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{sub?.status === "active" ? "✓" : "✗"}</div>
            <div className="text-xs text-muted-foreground">Subscription</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">Your Profile</h3>
            <p className="text-xs text-muted-foreground mb-3">Keep your bio, location, and specialties up to date.</p>
            <Link href="/dashboard/profile"><Button size="sm" variant="outline" className="w-full">Edit Profile</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">Portfolio</h3>
            <p className="text-xs text-muted-foreground mb-3">Upload and manage your portfolio images.</p>
            <Link href="/dashboard/portfolio"><Button size="sm" variant="outline" className="w-full">Manage Images</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">Subscription</h3>
            <p className="text-xs text-muted-foreground mb-3">Manage your billing and subscription plan.</p>
            <Link href="/dashboard/subscription"><Button size="sm" variant="outline" className="w-full">Manage Billing</Button></Link>
          </CardContent>
        </Card>
      </div>

      {/* View listing link */}
      {pro.status === "approved" && (
        <div className="flex justify-end">
          <Link href={`/professionals/${pro.slug}`} target="_blank">
            <Button variant="ghost" size="sm">View My Listing ↗</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
